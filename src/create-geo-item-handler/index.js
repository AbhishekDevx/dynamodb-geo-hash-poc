import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { uuid } from 'uuidv4';
import geoHash from 'ngeohash';
import { lambdaResponse } from '../common/utils.js';

const { REGION, LOCATION_TABLE } = process.env;

const documentClient = new DynamoDBClient({
    region: REGION
});
const docClient = DynamoDBDocumentClient.from(documentClient);

export const handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event));

    const { body = false } = event;
    if (!body) return lambdaResponse(400, { status: false, message: 'Invalid request, body is required!'});

    const parsedBody = JSON.parse(body);
    const { name, geoPoint, description } = parsedBody;
    const locationId = uuid();

    const geoHashValue = geoHash.encode(geoPoint.latitude, geoPoint.longitude);

    const params = {
        TableName: LOCATION_TABLE,
        Item: {
            pk: 'LOCATION',
            sk: `${geoHashValue}#${locationId}`,
            name,
            description,
            geoPoint,
        }
    };

    console.log('Create Command Params', JSON.stringify(params));
    const result = await docClient.send(new PutCommand(params));
    console.log('Create Command Result', JSON.stringify(result));

    if (result) {
        console.log('Item created successfully!');
        return lambdaResponse(200, { status: true, message: 'Item created successfully!', data: params });
    } else {
        console.log('Item creation failed!');
        return lambdaResponse(500, { status: false, message: 'Item creation failed!', error: {}});
    }
};
