import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kendra from 'aws-cdk-lib/aws-kendra';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import { aws_bedrock as bedrock } from 'aws-cdk-lib';

const region = process.env.CDK_DEFAULT_REGION;    
const accountId = process.env.CDK_DEFAULT_ACCOUNT;
const debug = false;
const stage = 'dev';
const s3_prefix = 'docs';
const enableParallelSummary = 'false';
const enalbeParentDocumentRetrival = 'true';
const projectName = `info-analytic-agent`; 
const bucketName = `storage-for-${projectName}-${accountId}-${region}`; 

const debugMessageMode = 'false'; // if true, debug messages will be delivered to the client.
const supportedFormat = JSON.stringify(["pdf", "txt", "csv", "pptx", "ppt", "docx", "doc", "xlsx", "py", "js", "md", 'png', 'jpeg', 'jpg']);  

const max_object_size = 102400000; // 100 MB max size of an object, 50MB(default)
const enableHybridSearch = 'true';

const claude3_5_sonnet = [
  {
    "bedrock_region": "us-west-2", // Oregon
    "model_type": "claude3.5",
    "max_tokens": 4096,
    "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0"
  },
  {
    "bedrock_region": "us-east-1", // N.Virginia
    "model_type": "claude3.5",
    "max_tokens": 4096,
    "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0"
  },
  {
    "bedrock_region": "eu-central-1", // Frankfurt
    "model_type": "claude3.5",
    "max_tokens": 4096,
    "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0"
  },
  {
    "bedrock_region": "ap-northeast-1", // Tokyo
    "model_type": "claude3.5",
    "max_tokens": 4096,
    "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0"
  }
];

const claude3_sonnet = [
  {
    "bedrock_region": "us-west-2", // Oregon
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0"
  },
  {
    "bedrock_region": "us-east-1", // N.Virginia
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0"
  },
  {
    "bedrock_region": "ca-central-1", // Canada
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0"
  },
  {
    "bedrock_region": "eu-west-2", // London
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0"
  },
  {
    "bedrock_region": "sa-east-1", // Sao Paulo
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-sonnet-20240229-v1:0"
  }
];

const claude3_haiku = [
  {
    "bedrock_region": "us-west-2", // Oregon
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-haiku-20240307-v1:0"
  },
  {
    "bedrock_region": "us-east-1", // N.Virginia
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-haiku-20240307-v1:0"
  },
  {
    "bedrock_region": "ca-central-1", // Canada
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-haiku-20240307-v1:0"
  },
  {
    "bedrock_region": "eu-west-2", // London
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-haiku-20240307-v1:0"
  },
  {
    "bedrock_region": "sa-east-1", // Sao Paulo
    "model_type": "claude3",
    "model_id": "anthropic.claude-3-haiku-20240307-v1:0"
  }
];

const titan_embedding_v1 = [  // dimension = 1536
  {
    "bedrock_region": "us-west-2", // Oregon
    "model_type": "titan",
    "model_id": "amazon.titan-embed-text-v1"
  },
  {
    "bedrock_region": "us-east-1", // N.Virginia
    "model_type": "titan",
    "model_id": "amazon.titan-embed-text-v1"
  }
];

const titan_embedding_v2 = [  // dimension = 1024
  {
    "bedrock_region": "us-west-2", // Oregon
    "model_type": "titan",
    "model_id": "amazon.titan-embed-text-v2:0"
  },
  {
    "bedrock_region": "us-east-1", // N.Virginia
    "model_type": "titan",
    "model_id": "amazon.titan-embed-text-v2:0"
  },
  {
    "bedrock_region": "ca-central-1", // Canada
    "model_type": "titan",
    "model_id": "amazon.titan-embed-text-v2:0"
  },
  {
    "bedrock_region": "eu-west-2", // London
    "model_type": "titan",
    "model_id": "amazon.titan-embed-text-v2:0"
  },
  {
    "bedrock_region": "sa-east-1", // Sao Paulo
    "model_type": "titan",
    "model_id": "amazon.titan-embed-text-v2:0"
  }
];

const LLM_for_chat = claude3_sonnet;
const LLM_for_multimodal = claude3_sonnet;
const LLM_embedding = titan_embedding_v2;
const vectorIndexName = `${projectName}`

export class CdkAnalyticAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // OpenSearch Serverless
    const collectionName = projectName
    const OpenSearchCollection = new opensearchserverless.CfnCollection(this, `opensearch-correction-for-${projectName}`, {
      name: collectionName,    
      description: `opensearch correction for ${projectName}`,
      standbyReplicas: 'DISABLED',
      type: 'VECTORSEARCH',
    });
    const collectionArn = OpenSearchCollection.attrArn
    const opensearch_url = OpenSearchCollection.attrCollectionEndpoint

    new cdk.CfnOutput(this, 'OpensearchCollectionEndpoint', {
      value: opensearch_url,
      description: 'The endpoint of opensearch correction',
    });

    const encPolicyName = `encription-${projectName}`
    const encPolicy = new opensearchserverless.CfnSecurityPolicy(this, `opensearch-encription-security-policy-for-${projectName}`, {
      name: encPolicyName,
      type: "encryption",
      description: `opensearch encryption policy for ${projectName}`,
      policy:
        '{"Rules":[{"ResourceType":"collection","Resource":["collection/*"]}],"AWSOwnedKey":true}',      
    });
    OpenSearchCollection.addDependency(encPolicy);

    const netPolicyName = `network-${projectName}`
    const netPolicy = new opensearchserverless.CfnSecurityPolicy(this, `opensearch-network-security-policy-for-${projectName}`, {
      name: netPolicyName,
      type: 'network',    
      description: `opensearch network policy for ${projectName}`,
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: "dashboard",
              Resource: [`collection/${netPolicyName}`],
            },
            {
              ResourceType: "collection",
              Resource: [`collection/${netPolicyName}`],              
            }
          ],
          AllowFromPublic: true,
        },
      ]), 
      
    });
    OpenSearchCollection.addDependency(netPolicy);

    const dataAccessPolicyName = `data-${projectName}`
    const dataAccessPolicy = new opensearchserverless.CfnAccessPolicy(this, `opensearch-data-collection-policy-for-${projectName}`, {
      name: dataAccessPolicyName,
      type: "data",
      policy: JSON.stringify([
        {
          Rules: [
            {
              Resource: [`collection/${collectionName}`],
              Permission: [
                "aoss:CreateCollectionItems",
                "aoss:DeleteCollectionItems",
                "aoss:UpdateCollectionItems",
                "aoss:DescribeCollectionItems",
              ],
              ResourceType: "collection",
            },
            {
              Resource: [`index/${collectionName}/*`],
              Permission: [
                "aoss:CreateIndex",
                "aoss:DeleteIndex",
                "aoss:UpdateIndex",
                "aoss:DescribeIndex",
                "aoss:ReadDocument",
                "aoss:WriteDocument",
              ], 
              ResourceType: "index",
            }
          ],
          Principal: [
            `arn:aws:iam::${accountId}:role/role-lambda-chat-ws-for-${projectName}-${region}`,
            `arn:aws:sts::${accountId}:assumed-role/administration/ksdyb-Isengard`, 
          ], 
        },
      ]),
    });
    OpenSearchCollection.addDependency(dataAccessPolicy);

    // s3 
    const s3Bucket = new s3.Bucket(this, `storage-${projectName}`,{
      bucketName: bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: ['*'],
        },
      ],
    });
    if(debug) {
      new cdk.CfnOutput(this, 'bucketName', {
        value: s3Bucket.bucketName,
        description: 'The nmae of bucket',
      });
      new cdk.CfnOutput(this, 's3Arn', {
        value: s3Bucket.bucketArn,
        description: 'The arn of s3',
      });
      new cdk.CfnOutput(this, 's3Path', {
        value: 's3://'+s3Bucket.bucketName,
        description: 'The path of s3',
      });
    }

    // copy web application files into s3 bucket
    //new s3Deploy.BucketDeployment(this, `upload-HTML-for-${projectName}`, {
    //  sources: [s3Deploy.Source.asset("../html/")],
    //  destinationBucket: s3Bucket,
    //});    
    
    new cdk.CfnOutput(this, 'HtmlUpdateCommend', {
      value: 'aws s3 cp ../html/ ' + 's3://' + s3Bucket.bucketName + '/ --recursive',
      description: 'copy commend for web pages',
    });

    // cloudfront
    const distribution = new cloudFront.Distribution(this, `cloudfront-for-${projectName}`, {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudFront.PriceClass.PRICE_CLASS_200,  
    });
    new cdk.CfnOutput(this, `distributionDomainName-for-${projectName}`, {
      value: distribution.domainName,
      description: 'The domain name of the Distribution',
    });

    // DynamoDB for call log
    const callLogTableName = `db-call-log-for-${projectName}`;
    const callLogDataTable = new dynamodb.Table(this, `db-call-log-for-${projectName}`, {
      tableName: callLogTableName,
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'request_time', type: dynamodb.AttributeType.STRING }, 
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const callLogIndexName = `index-type-for-${projectName}`;
    callLogDataTable.addGlobalSecondaryIndex({ // GSI
      indexName: callLogIndexName,
      partitionKey: { name: 'request_id', type: dynamodb.AttributeType.STRING },
    });
    
    // Lambda - chat (websocket)
    const roleLambdaWebsocket = new iam.Role(this, `role-lambda-chat-ws-for-${projectName}`, {
      roleName: `role-lambda-chat-ws-for-${projectName}-${region}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal("bedrock.amazonaws.com")
      )
    });
    roleLambdaWebsocket.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });
    const BedrockPolicy = new iam.PolicyStatement({  // policy statement for sagemaker
      resources: ['*'],
      actions: ['bedrock:*'],
    });
    roleLambdaWebsocket.attachInlinePolicy( // add bedrock policy
      new iam.Policy(this, `bedrock-policy-lambda-chat-ws-for-${projectName}`, {
        statements: [BedrockPolicy],
      }),
    );        
    const apiInvokePolicy = new iam.PolicyStatement({ 
      resources: ['*'],
      actions: [
        'execute-api:Invoke',
        'execute-api:ManageConnections'
      ],
    });      
    roleLambdaWebsocket.attachInlinePolicy( 
      new iam.Policy(this, `api-invoke-policy-for-${projectName}`, {
        statements: [apiInvokePolicy],
      }),
    );    

    // aoss
    const aossRolePolicy = new iam.PolicyStatement({  
      resources: ['*'],      
      actions: ['aoss:*'],
    }); 
    roleLambdaWebsocket.attachInlinePolicy( 
      new iam.Policy(this, `aoss-policy-for-${projectName}`, {
        statements: [aossRolePolicy],
      }),
    ); 

    // aoss
    const getRolePolicy = new iam.PolicyStatement({  
      resources: ['*'],      
      actions: ['iam:GetRole'],
    }); 
    roleLambdaWebsocket.attachInlinePolicy( 
      new iam.Policy(this, `getRole-policy-for-${projectName}`, {
        statements: [getRolePolicy],
      }),
    ); 

    // api role
    const role = new iam.Role(this, `api-role-for-${projectName}`, {
      roleName: `api-role-for-${projectName}-${region}`,
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });
    role.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: [
        'lambda:InvokeFunction',
        'cloudwatch:*'
      ]
    }));
    role.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/AWSLambdaExecute',
    }); 

    // API Gateway
    const api = new apiGateway.RestApi(this, `api-chatbot-for-${projectName}`, {
      description: 'API Gateway for chatbot',
      endpointTypes: [apiGateway.EndpointType.REGIONAL],
      binaryMediaTypes: ['application/pdf', 'text/plain', 'text/csv', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel', 'application/msword'], 
      deployOptions: {
        stageName: stage,

        // logging for debug
        // loggingLevel: apiGateway.MethodLoggingLevel.INFO, 
        // dataTraceEnabled: true,
      },
    });  
   
    new cdk.CfnOutput(this, `WebUrl-for-${projectName}`, {
      value: 'https://'+distribution.domainName+'/index.html',      
      description: 'The web url of request for chat',
    });        

    // Lambda - Upload
    const lambdaUpload = new lambda.Function(this, `lambda-upload-for-${projectName}`, {
      runtime: lambda.Runtime.NODEJS_16_X, 
      functionName: `lambda-upload-for-${projectName}`,
      code: lambda.Code.fromAsset("../lambda-upload"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      environment: {
        bucketName: s3Bucket.bucketName,
        s3_prefix:  s3_prefix
      }      
    });
    s3Bucket.grantReadWrite(lambdaUpload);
    
    // POST method - upload
    const resourceName = "upload";
    const upload = api.root.addResource(resourceName);
    upload.addMethod('POST', new apiGateway.LambdaIntegration(lambdaUpload, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [  
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 
    if(debug) {
      new cdk.CfnOutput(this, `ApiGatewayUrl-for-${projectName}`, {
        value: api.url+'upload',
        description: 'The url of API Gateway',
      }); 
    }

    // cloudfront setting  
    distribution.addBehavior("/upload", new origins.RestApiOrigin(api), {
      cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,  
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });    

    // Lambda - queryResult
    const lambdaQueryResult = new lambda.Function(this, `lambda-query-for-${projectName}`, {
      runtime: lambda.Runtime.NODEJS_16_X, 
      functionName: `lambda-query-for-${projectName}`,
      code: lambda.Code.fromAsset("../lambda-query"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(60),
      environment: {
        tableName: callLogTableName,
        indexName: callLogIndexName
      }      
    });
    callLogDataTable.grantReadWriteData(lambdaQueryResult); // permission for dynamo
    
    // POST method - query
    const query = api.root.addResource("query");
    query.addMethod('POST', new apiGateway.LambdaIntegration(lambdaQueryResult, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [  
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 

    // cloudfront setting for api gateway    
    distribution.addBehavior("/query", new origins.RestApiOrigin(api), {
      cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,  
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    // Lambda - getHistory
    const lambdaGetHistory = new lambda.Function(this, `lambda-gethistory-for-${projectName}`, {
      runtime: lambda.Runtime.NODEJS_16_X, 
      functionName: `lambda-gethistory-for-${projectName}`,
      code: lambda.Code.fromAsset("../lambda-gethistory"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(60),
      environment: {
        tableName: callLogTableName
      }      
    });
    callLogDataTable.grantReadWriteData(lambdaGetHistory); // permission for dynamo
    
    // POST method - history
    const history = api.root.addResource("history");
    history.addMethod('POST', new apiGateway.LambdaIntegration(lambdaGetHistory, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [  
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 

    // cloudfront setting for api gateway    
    distribution.addBehavior("/history", new origins.RestApiOrigin(api), {
      cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,  
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    // Lambda - deleteItems
    const lambdaDeleteItems = new lambda.Function(this, `lambda-deleteItems-for-${projectName}`, {
      runtime: lambda.Runtime.NODEJS_16_X, 
      functionName: `lambda-deleteItems-for-${projectName}`,
      code: lambda.Code.fromAsset("../lambda-delete-items"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(60),
      environment: {
        tableName: callLogTableName
      }      
    });
    callLogDataTable.grantReadWriteData(lambdaDeleteItems); // permission for dynamo
    
    // POST method - delete items
    const deleteItem = api.root.addResource("delete");
    deleteItem.addMethod('POST', new apiGateway.LambdaIntegration(lambdaDeleteItems, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [  
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 

    // cloudfront setting for api gateway    
    distribution.addBehavior("/delete", new origins.RestApiOrigin(api), {
      cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,  
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    // stream api gateway
    // API Gateway
    const websocketapi = new apigatewayv2.CfnApi(this, `ws-api-for-${projectName}`, {
      description: 'API Gateway for chatbot using websocket',
      apiKeySelectionExpression: "$request.header.x-api-key",
      name: 'api-'+projectName,
      protocolType: "WEBSOCKET", // WEBSOCKET or HTTP
      routeSelectionExpression: "$request.body.action",     
    });  
    websocketapi.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY); // DESTROY, RETAIN

    const wss_url = `wss://${websocketapi.attrApiId}.execute-api.${region}.amazonaws.com/${stage}`;
    new cdk.CfnOutput(this, 'web-socket-url', {
      value: wss_url,      
      description: 'The URL of Web Socket',
    });

    const connection_url = `https://${websocketapi.attrApiId}.execute-api.${region}.amazonaws.com/${stage}`;
    if(debug) {
      new cdk.CfnOutput(this, 'api-identifier', {
        value: websocketapi.attrApiId,
        description: 'The API identifier.',
      });

      new cdk.CfnOutput(this, 'connection-url', {
        value: connection_url,        
        description: 'The URL of connection',
      });
    }

    const weatherApiSecret = new secretsmanager.Secret(this, `weather-api-secret-for-${projectName}`, {
      description: 'secret for weather api key', // openweathermap
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      secretName: `openweathermap-${projectName}`,
      secretObjectValue: {
        project_name: cdk.SecretValue.unsafePlainText(projectName),
        weather_api_key: cdk.SecretValue.unsafePlainText(''),
      },
    });
    weatherApiSecret.grantRead(roleLambdaWebsocket) 

    const langsmithApiSecret = new secretsmanager.Secret(this, `weather-langsmith-secret-for-${projectName}`, {
      description: 'secret for lamgsmith api key', // openweathermap
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      secretName: `langsmithapikey-${projectName}`,
      secretObjectValue: {
        langchain_project: cdk.SecretValue.unsafePlainText(projectName),
        langsmith_api_key: cdk.SecretValue.unsafePlainText(''),
      },
    });
    langsmithApiSecret.grantRead(roleLambdaWebsocket) 

    const tavilyApiSecret = new secretsmanager.Secret(this, `weather-tavily-secret-for-${projectName}`, {
      description: 'secret for lamgsmith api key', // openweathermap
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      secretName: `tavilyapikey-${projectName}`,
      secretObjectValue: {
        project_name: cdk.SecretValue.unsafePlainText(projectName),
        tavily_api_key: cdk.SecretValue.unsafePlainText(''),
      },
    });
    tavilyApiSecret.grantRead(roleLambdaWebsocket) 

    // lambda-chat using websocket    
    const lambdaChatWebsocket = new lambda.DockerImageFunction(this, `lambda-chat-ws-for-${projectName}`, {
      description: 'lambda for chat using websocket',
      functionName: `lambda-chat-ws-for-${projectName}`,
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../lambda-chat-ws')),
      timeout: cdk.Duration.seconds(300),
      memorySize: 2048,
      role: roleLambdaWebsocket,
      environment: {
        s3_bucket: s3Bucket.bucketName,
        s3_prefix: s3_prefix,
        callLogTableName: callLogTableName,
        connection_url: connection_url,
        opensearch_url: opensearch_url,
        path: 'https://'+distribution.domainName+'/',   
        debugMessageMode: debugMessageMode,
        LLM_for_chat: JSON.stringify(LLM_for_chat),          
        LLM_for_multimodal: JSON.stringify(claude3_sonnet),          
        LLM_embedding: JSON.stringify(LLM_embedding),
        projectName: projectName,
        vectorIndexName: vectorIndexName,
        enalbeParentDocumentRetrival: enalbeParentDocumentRetrival
      }
    });     
    lambdaChatWebsocket.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));  
    s3Bucket.grantReadWrite(lambdaChatWebsocket); // permission for s3
    callLogDataTable.grantReadWriteData(lambdaChatWebsocket); // permission for dynamo 
    
    if(debug) {
      new cdk.CfnOutput(this, 'function-chat-ws-arn', {
        value: lambdaChatWebsocket.functionArn,
        description: 'The arn of lambda webchat.',
      }); 
    }

    const integrationUri = `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaChatWebsocket.functionArn}/invocations`;    
    const cfnIntegration = new apigatewayv2.CfnIntegration(this, `api-integration-for-${projectName}`, {
      apiId: websocketapi.attrApiId,
      integrationType: 'AWS_PROXY',
      credentialsArn: role.roleArn,
      connectionType: 'INTERNET',
      description: 'Integration for connect',
      integrationUri: integrationUri,
    });  

    new apigatewayv2.CfnRoute(this, `api-route-for-${projectName}-connect`, {
      apiId: websocketapi.attrApiId,
      routeKey: "$connect", 
      apiKeyRequired: false,
      authorizationType: "NONE",
      operationName: 'connect',
      target: `integrations/${cfnIntegration.ref}`,      
    }); 

    new apigatewayv2.CfnRoute(this, `api-route-for-${projectName}-disconnect`, {
      apiId: websocketapi.attrApiId,
      routeKey: "$disconnect", 
      apiKeyRequired: false,
      authorizationType: "NONE",
      operationName: 'disconnect',
      target: `integrations/${cfnIntegration.ref}`,      
    }); 

    new apigatewayv2.CfnRoute(this, `api-route-for-${projectName}-default`, {
      apiId: websocketapi.attrApiId,
      routeKey: "$default", 
      apiKeyRequired: false,
      authorizationType: "NONE",
      operationName: 'default',
      target: `integrations/${cfnIntegration.ref}`,      
    }); 

    new apigatewayv2.CfnStage(this, `api-stage-for-${projectName}`, {
      apiId: websocketapi.attrApiId,
      stageName: stage
    }); 

    // S3 - Lambda(S3 event) - SQS(fifo) - Lambda(document)
    // DLQ
    let dlq:any[] = [];
    for(let i=0;i<LLM_for_multimodal.length;i++) {
      dlq[i] = new sqs.Queue(this, 'DlqS3EventFifo'+i, {
        visibilityTimeout: cdk.Duration.seconds(600),
        queueName: `dlq-s3-event-for-${projectName}-${i}.fifo`,  
        fifo: true,
        contentBasedDeduplication: false,
        deliveryDelay: cdk.Duration.millis(0),
        retentionPeriod: cdk.Duration.days(14),
      });
    }

    // SQS for S3 event (fifo) 
    let queueUrl:string[] = [];
    let queue:any[] = [];
    for(let i=0;i<LLM_for_multimodal.length;i++) {
      queue[i] = new sqs.Queue(this, 'QueueS3EventFifo'+i, {
        visibilityTimeout: cdk.Duration.seconds(600),
        queueName: `queue-s3-event-for-${projectName}-${i}.fifo`,  
        fifo: true,
        contentBasedDeduplication: false,
        deliveryDelay: cdk.Duration.millis(0),
        retentionPeriod: cdk.Duration.days(2),
        deadLetterQueue: {
          maxReceiveCount: 4,
          queue: dlq[i]
        }
      });
      queueUrl.push(queue[i].queueUrl);
    }

    // Lambda for s3 event manager
    const lambdaS3eventManager = new lambda.Function(this, `lambda-s3-event-manager-for-${projectName}`, {
      description: 'lambda for s3 event manager',
      functionName: `lambda-s3-event-manager-for-${projectName}`,
      handler: 'lambda_function.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-s3-event-manager')),
      timeout: cdk.Duration.seconds(60),      
      environment: {
        sqsFifoUrl: JSON.stringify(queueUrl),
        nqueue: String(LLM_for_multimodal.length)
      }
    });
    for(let i=0;i<LLM_for_multimodal.length;i++) {
      queue[i].grantSendMessages(lambdaS3eventManager); // permision for SQS putItem
    }

    // Lambda for document manager
    let lambdDocumentManager:any[] = [];
    for(let i=0;i<LLM_for_multimodal.length;i++) {
      lambdDocumentManager[i] = new lambda.DockerImageFunction(this, `lambda-document-manager-for-${projectName}-${i}`, {
        description: 'S3 document manager',
        functionName: `lambda-document-manager-for-${projectName}-${i}`,
        role: roleLambdaWebsocket,
        code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../lambda-document-manager')),
        timeout: cdk.Duration.seconds(600),
        memorySize: 8192,
        environment: {
          s3_bucket: s3Bucket.bucketName,
          s3_prefix: s3_prefix,
          enableParallelSummary: enableParallelSummary,
          enalbeParentDocumentRetrival: enalbeParentDocumentRetrival,          
          opensearch_url: opensearch_url,
          sqsUrl: queueUrl[i],
          LLM_for_chat: JSON.stringify(LLM_for_chat),          
          LLM_for_multimodal: JSON.stringify(claude3_sonnet),          
          LLM_embedding: JSON.stringify(LLM_embedding),
          roleArn: roleLambdaWebsocket.roleArn,
          path: 'https://'+distribution.domainName+'/',           
          max_object_size: String(max_object_size),
          supportedFormat: supportedFormat,
          enableHybridSearch: enableHybridSearch,
          vectorIndexName: vectorIndexName
        }
      });         
      s3Bucket.grantReadWrite(lambdDocumentManager[i]); // permission for s3
      lambdDocumentManager[i].addEventSource(new SqsEventSource(queue[i])); // permission for SQS
    }
    
    // s3 event source
    const s3PutEventSource = new lambdaEventSources.S3EventSource(s3Bucket, {
      events: [
        s3.EventType.OBJECT_CREATED_PUT,
        s3.EventType.OBJECT_REMOVED_DELETE,
        s3.EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD
      ],
      filters: [
        { prefix: s3_prefix+'/' },
      ]
    });
    lambdaS3eventManager.addEventSource(s3PutEventSource); 

    // lambda - provisioning
    const lambdaProvisioning = new lambda.Function(this, `lambda-provisioning-for-${projectName}`, {
      description: 'lambda to earn provisioning info',
      functionName: `lambda-provisioning-api-${projectName}`,
      handler: 'lambda_function.lambda_handler',
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda-provisioning')),
      timeout: cdk.Duration.seconds(30),
      environment: {
        wss_url: wss_url,
      }
    });

    // POST method - provisioning
    const provisioning_info = api.root.addResource("provisioning");
    provisioning_info.addMethod('POST', new apiGateway.LambdaIntegration(lambdaProvisioning, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [  
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 

    // cloudfront setting for provisioning api
    distribution.addBehavior("/provisioning", new origins.RestApiOrigin(api), {
      cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
      allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,  
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });
    
    // deploy components
    new componentDeployment(scope, `component-deployment-of-${projectName}`, websocketapi.attrApiId)     
  }
}

export class componentDeployment extends cdk.Stack {
  constructor(scope: Construct, id: string, appId: string, props?: cdk.StackProps) {    
    super(scope, id, props);

    new apigatewayv2.CfnDeployment(this, `api-deployment-of-${projectName}`, {
      apiId: appId,
      description: "deploy api gateway using websocker",  // $default
      stageName: stage
    });   
  }
}
