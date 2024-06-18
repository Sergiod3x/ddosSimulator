const axios = require('axios');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

// Configura il tuo endpoint GraphQL e Cognito
const endpointUrl = 'https://wg5zw5uawrenlduk54pq7zy54a.appsync-api.eu-west-1.amazonaws.com/graphql';
const poolData = {
    UserPoolId: 'xxxxx', // Il tuo User Pool ID
    ClientId: 'xxxx' // Il tuo Client ID
};
const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: 'sergiod3x@gmail.com', // Il tuo username
    Password: 'xxxxx' // La tua password
});

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: 'xxxxx', // Il tuo username
    Pool: userPool
});

// Numero totale di chiamate
const totalCalls = 1500;

// Durata totale in millisecondi (3 minuti)
const totalDuration = 1 * 60 * 1000;

// Intervallo tra le chiamate (in millisecondi)
const interval = totalDuration / totalCalls;

// La tua query GraphQL per ottenere le sessioni di analisi
const graphqlQuery = `
  query ListAnalyticsSessions($group: ID!, $passcode: String!) {
    listAnalyticsSessions(group: $group, passcode: $passcode) {
      items {
        group
        ulid
        timestamp
        passcode
        content
      }
      nextToken
    }
  }
`;

// Variabili per la query
const variables = {
    group: "your-group-id",
    passcode: "your-passcode"
};

// Funzione per ottenere il token di accesso
function authenticateUser() {
    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (session) => {
                resolve(session.getIdToken().getJwtToken());
            },
            onFailure: (err) => {
                reject(err);
            }
        });
    });
}

// Funzione per inviare una richiesta GraphQL
async function makeRequest(token) {
    try {
        const response = await axios.post(endpointUrl, {
            query: graphqlQuery,
            variables: variables
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        console.log(`Status Code: ${response.status}, Data: ${JSON.stringify(response.data)}`);
    } catch (error) {
        console.error(`Errore nella richiesta: ${error}`);
    }
}

async function runLoadTest() {
    try {
        const token = await authenticateUser();
        let callCount = 0;

        const intervalId = setInterval(() => {
            if (callCount >= totalCalls) {
                clearInterval(intervalId);
                return;
            }

            makeRequest(token);
            callCount++;
        }, interval);
    } catch (error) {
        console.error(`Errore durante l'autenticazione: ${error}`);
    }
}

runLoadTest();
