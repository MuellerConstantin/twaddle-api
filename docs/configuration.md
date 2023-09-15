# Configuration

The configuration is based on the [dotenv](https://www.dotenv.org/) package. Usually environment variables or environment files,
environment variables defined in a specific file, are used. The latter should be found in the current working directory.
Basically, the entire application can be personalized via external configuration.

## Environment Variables

Settings relevant to the application are listed below.

### General

General settings for the application and the web server used.

| Variable                    | Description                                         | Required |
| --------------------------- | --------------------------------------------------- | -------- |
| PORT                        | Port of the application server. Default is `3000`.  | false    |
| LOGGER_LEVEL                | The log level of the application.                   | false    |
| LOGGER_FILENAME             | The file to which the application logs are written. | false    |
| FIRST_PARTY_CLIENT_BASE_URL | The base URL of the 1st party client.               | true     |

### Database

All settings for databases, web storage and other data sources used.

| Variable             | Description                                     | Required |
| -------------------- | ----------------------------------------------- | -------- |
| MONGO_URI            | The URI to the MongoDB database to use.         | true     |
| REDIS_URI            | The URI to the Redis database to use.           | true     |
| S3_URI               | The URI to the S3 object storage to use.        | true     |
| S3_ACCESS_KEY_ID     | The access key ID of the S3 object storage.     | true     |
| S3_SECRET_ACCESS_KEY | The secret access key of the S3 object storage. | true     |
| S3_REGION            | The region of the S3 object storage.            | true     |
| S3_BUCKET            | The bucket of the S3 object storage.            | true     |

### Email

All email server related settings.

| Variable      | Description                                                | Required |
| ------------- | ---------------------------------------------------------- | -------- |
| SMTP_HOST     | Host of the SMTP server used for emails.                   | true     |
| SMTP_PORT     | Port of the SMTP server used for emails.                   | true     |
| SMTP_USER     | Name of user to authenticate with the SMTP server.         | false    |
| SMTP_PASSWORD | Password of the user to authenticate with the SMTP server. | false    |
| SMTP_SECURE   | Whether to use TLS or not.                                 | false    |

### Security/Authentication

Settings that are related to the security of the application or the authentication mechanism.

| Variable                   | Description                                                                                                           | Required |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| AUTH_TOKEN_SECRET          | The secret used to sign the JWT access tokens.                                                                        | true     |
| AUTH_TOKEN_EXPIRES         | The duration in seconds after which the access token expires. Default is `300`.                                       | false    |
| REFRESH_TOKEN_EXPIRES      | The duration in seconds after which the refresh token expires. Default is `18000`.                                    | false    |
| VERIFICATION_TOKEN_EXPIRES | The duration in seconds after which the verification token, used for account verification, expires. Default is `600`. | false    |
| RESET_TOKEN_EXPIRES        | The duration in seconds after which the reset token, used for password resets, expires. Default is `600`.             | false    |
| TICKET_EXPIRES             | The duration in seconds after which the ticket, used for websocket authentication, expires. Default is `120`.         | false    |

## Configuration/Environment Files

Environment files define the environment variables as a text file in a central location. This means that the variables do not have to
be stored in the system or entered manually when the process starts. Hence, the use of environment files is recommended. The variables are
created as key value pairs, one pair per line, separated by an equal sign. For more details see [environment files](https://www.dotenv.org/docs/security/env).

The following files are supported:

- `.env.<development | test | production>.local`
- `.env.<development | test | production>`
- `.env.local`
- `.env`

Files at the top have higher priority than files at the bottom of the list. In addition, the files with the suffix `.local` are ignored by
the version control system. This means that they can be used to store sensitive information such as passwords and access keys or
development-specific information such as the port number.
