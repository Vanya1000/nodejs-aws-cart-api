import * as cdk from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as apiGateway from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { join } from 'path';
import 'dotenv/config';

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'CartServiceVPC', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: 'IsolatedSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Allow Lambda access to RDS',
      allowAllOutbound: true,
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Lambda security group',
        allowAllOutbound: true,
      },
    );

    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda access to RDS',
    );

    const rdsInstance = new rds.DatabaseInstance(this, 'CartServiceRDS', {
      databaseName: process.env.DB_NAME,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromPassword(
        process.env.DB_USER,
        cdk.SecretValue.unsafePlainText(process.env.DB_PASSWORD),
      ),
      backupRetention: cdk.Duration.days(0),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      allocatedStorage: 20,
      multiAz: false,
      storageEncrypted: false,
      publiclyAccessible: false,
    });

    const nestLambda = new NodejsFunction(this, 'NestJSFunction', {
      entry: join(__dirname, '..', '..', 'dist', 'main.js'),
      runtime: Runtime.NODEJS_20_X,
      functionName: 'nest-app',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_HOST: rdsInstance.instanceEndpoint.hostname,
        DB_NAME: process.env.DB_NAME,
        DB_PORT: rdsInstance.instanceEndpoint.port.toString(),
        PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL,
        NODE_OPTIONS: '--trace-deprecation',
        NODE_NO_WARNINGS: '1',
      },
    });

    const lambdaIntegration = new HttpLambdaIntegration(
      'LambdaIntegration',
      nestLambda,
    );

    new apiGateway.HttpApi(this, 'NestApiGateway', {
      defaultIntegration: lambdaIntegration,
    });
  }
}
