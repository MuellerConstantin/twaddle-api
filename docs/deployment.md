# Deployment

Deployment consists of two steps, setting up the system environment, which includes the necessary third-party services,
and deploying the actual server application. The deployment of the Twaddle API application can be done either using
containerization or in standalone mode.

## System Environment

The application uses a number of third-party services and also requires them to function correctly. It is therefore
necessary to make these services available and to make them known accordingly. All third-party services can be
configured using the environment variables described under [configuration](./configuration.md).

- MongoDB Database Server
- Redis Database Server
- SMTP Email Server
- S3 Object Storage Server

The Twaalde API uses Mongoose as ODM based on a MongoDB database to store system and business information. In addition
to the document database, Twaddle uses a faster in-memory key-value database, currently only Redis is supported. Redis
is required as a cache for volatile information and for sessions/tokens. For binary data like images or audio files,
Twaddle uses an S3 object storage for persistence. Twaddle also requires an SMTP mail server to send emails. In principle,
any email provider and their SMTP server can be used.

## Twaddle Deployment

As earlier mentioned, the Twaddle API application can be either deployed using containerization or in standalone mode.

### Standalone

In the standalone variant, the application runs directly on the Node.js runtime environment of the target system. Hence,
this requires a Node.js runtime environemnt of version 18 or higher. In addition, NPM is required for building and
launching the application.

```shell
npm run start
```

In order for the application to start and work correctly, some options must be configured in addition to the installation.
The easiest way to configure the standalone variant is to use a environment file, called `.env` in the current working
directory of the process, usually the directory in which the above command is executed. Information on the application's
configurable options can be found under [configuration](./configuration.md).

#### Build application

If for any reason a pre-built version cannot be used, for example during development, it is possible to build the
application manually. The result is a build directory called `dist`, which contains the transpiled source files and
can be executed with the command above. To build it, run the following command.

```shell
npm run build
```

The resulting artifact, usually located in the project's root directory named `dist`, can be executed by the above
command.
