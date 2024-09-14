import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import geoHash from 'ngeohash';
import haversine from 'haversine-distance';
import { lambdaResponse } from '../common/utils.js';
import { calculateBoundingBox } from '../common/geo-lib.js';

const { REGION, LOCATION_TABLE } = process.env;

const documentClient = new DynamoDBClient({
    region: REGION
});
const docClient = DynamoDBDocumentClient.from(documentClient);

const queryGeoHash = async (docClient, geoHash) => {
    try {
        const data = await docClient.send(new QueryCommand({
            TableName: LOCATION_TABLE,
            KeyConditions: {
                pk: {
                    ComparisonOperator: 'EQ',
                    AttributeValueList: ['LOCATION']
                },
                sk: {
                    ComparisonOperator: 'BEGINS_WITH',
                    AttributeValueList: [geoHash]
                }
            }
        }));
        return data.Items;
    } catch (error) {
        console.error('Error querying geohash:', error);
        return [];
    }
};


export const handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event));

    const { queryStringParameters = false } = event;
    if (!queryStringParameters) return lambdaResponse(400, { status: false, message: 'latitude, longitude & radius is required to pass from query string.'});

    const { latitude, longitude, radius } = queryStringParameters;

    const geoHashPrecision = 5;
    const centerGeoHash = geoHash.encode(latitude, longitude, geoHashPrecision);
    const geoHashNeighbors = geoHash.neighbors(centerGeoHash);
    console.log('centerGeoHash and geoHashNeighbors location', JSON.stringify({ centerGeoHash, geoHashNeighbors }));
    geoHashNeighbors.push(centerGeoHash);

    let nearByLocations = [];
    await Promise.all(geoHashNeighbors.map(async (point) => {
        const results = await queryGeoHash(docClient, point);
        nearByLocations = [...nearByLocations, ...results];
    }));
    console.log('nearByLocations loop', JSON.stringify(nearByLocations));

    const filteredLocations = nearByLocations.filter((item) => {
        const { geoPoint } = item;
        const itemLat = geoPoint.latitude;
        const itemLon = geoPoint.longitude;

        const distance = haversine(
            { lat: latitude, lon: longitude },   // Center point
            { lat: itemLat, lon: itemLon }       // Item location
        );

        return distance <= radius; // Filter locations within the radius
    });

    console.log('Filtered location', JSON.stringify(filteredLocations));
    return lambdaResponse(200, { status: true, message: 'Thank you.', data: filteredLocations });
};
