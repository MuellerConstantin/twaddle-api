# Twaddle API

> Real time messenger and communication platform.

## Table of contents

- [Introduction](#introduction)
- [Architecture](#architecture)
  - [RESTful API](#restful-api)
  - [Web Socket API](#web-socket-api)
- [Configuration](#configuration)
  - [Envrionment Variables](#environment-variables)
  - [Operating Environment](#operating-environment)
- [Deployment](#deployment)
  - [Standalone operation](#standalone-operation)
  - [Cloud operation](#cloud-operation)
- [License](#license)
  - [Forbidden](#forbidden)

## Introduction

Messenger with user management for mutual communication exchange in real time.
This project does not serve to replace existing messengers from production,
but rather to understand communication processes in the area of messaging.

## Architecture

The communication platform has a monolithic structure. Nevertheless, the application
is architecturally developed in such a way that horizontal scaling and the associated
load balancing is possible. In a productive environment, an upstream gateway consisting
of reverse proxy and load balancer can be assumed.

The Twaddle Service provides two API interfaces, an HTTP RESTful interface and a Web
Sockets interface. In both cases, communication runs via the gateway. To enable horizontal
scaling, data must be stored in a common data source as an alternative to process memory.
The in-memory data structure storage [Redis](https://redis.io/) is used for this. Redis is
used to save temporary sessions and states, and is used in particular for scaled web socket
communication. In addition to Redis, a [MongoDB](https://www.mongodb.com/) instance is also
used for reasons of data persistence. While Redis acts as a message broker and temporary
storage, this database persists data.

![Architecture](./docs/images/architecture.png)

As already mentioned, the individual instance is a monolithic architecture which is organized
according to the three-layer model. Accordingly, there is a presentation layer, depending on
the API, HTTP RESTful or WebSocket Socket.IO is used, an application layer that contains the
business logic and a data layer that is responsible for data persistence.

![Architecture](./docs/images/layer-model.png)

### Twaddle Management API

The RESTful interface is used to exchange static data such as user profiles or access data.
The communication is stateless based on the [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc2616/)
protocol. The resources and endpoints are documented by the self-service documentation provided
by the service itself. See [Documentation](./docs/asciidoc/index.adoc#twaddle-management-api)
for details.

### Twaddle Communication API

A web socket interface is used for reactive tasks such as real-time communication. This is based on
the [WebSocket](https://datatracker.ietf.org/doc/html/rfc6455) protocol or, based on it, on the
[Socket.IO](https://github.com/socketio/socket.io-protocol) protocol. The resources and events
are documented by the self-service documentation provided by the service itself. See
[Documentation](./docs/asciidoc/index.adoc#twaddle-communication-api) for details.

## Configuration

In principle, the service can be fully configured via environment variables. These can be given to
the service via the system environment when called or via an environment file. With regard to the
configuration, it should be mentioned that the service works with three different configuration
profiles, `development`, `test` and `production`, and an additional default profile.
According to these profiles, the appropriate environment file is also loaded.

### Environment variables

The following variables are service parameters and affect the way it works.

| Variable                | Description                                                 | Required |
| ----------------------- | ----------------------------------------------------------- | -------- |
| LOGGER_LEVEL            | Logging level to use during runtime                         | false    |
| LOGGER_FILENAME         | Optional file to which the logs are also written            | false    |
| DATABASE_URL            | URL of the MongoDB database used as primary data store      | true     |
| CACHE_URL               | URL of the Redis instance used as secondary data store      | true     |
| SECURITY_TOKEN_EXPIRES  | Validity period of a access token in seconds                | false    |
| SECURITY_TICKET_EXPIRES | Validity period of a ticket in seconds                      | false    |
| SECURITY_RATE_LIMIT     | The request limit of the server per time in requests/second | false    |
| UPLOADS_LIMITS_FILESIZE | Limit for file uploads in bytes                             | false    |

Moreover, the following environment variables are not used directly by the Twaddle service, but by the
underlying system infrastructure such as the application server. Please note that only the
service-specific environment variables can be loaded from an environment file, but not the following
variables that affect the system infrastructure.

| Variable | Description                                                                 | Required |
| -------- | --------------------------------------------------------------------------- | -------- |
| NODE_ENV | Sets the environment profile, based on which the environment file is loaded | false    |
| PORT     | Sets the port of the underlying application server                          | false    |

#### Environment files

The dynamic configuration, in the form of environment variables, can also be loaded from files for
the sake of simplicity. So-called environment files. The variables introduced in the above section
can be written to the file as a key-value pair per line separated by an equals sign. The environment
files must be in the current working directory and named appropriately to be loaded. Basically, it
tries to load the following four files in descending order:

- `.env.<PROFILE>.local`
- `.env.<PROFILE>`
- `.env.local`
- `.env`

Configuration profiles enable profile-specific environments to be configured. Possible configuration
profiles are `development`, `test` and `production`. The `local` suffix marks an environment file as
local and prevents the configuration file from being included in the _Version Control System (VCS)_.
Secret information should therefore always be included in a local environment file.

Values of higher-ordered paths have higher priority and "override" values of lower-ordered paths. This
means that profile-specific files always take precedence over default files, and local always take
precedence over public files.

### Operating environment

In addition to configurable settings, the server also places a number of requirements on its environment
that must be met for smooth operation. These settings are embedded in the implementation and cannot be
changed.

#### Certificates

The server uses various encryption mechanisms, including issuing access tokens. certificates are required
for this. The server expects to find these in a directory named `resources` relative to the current working
directory without exception. Specifically, an RSA (RS256) public key and an RSA private key are expected under
the following paths:

- `resources/private.pem`
- `resources/public.pem`

The certificates must be stored in the current working directory alongside the installation.

#### Uploads

The server basically enables file uploads, the binary data is stored in the file system. For this, the server
uses the `uploads` directory relative to the current working directory. If not available, this directory must
be created before starting the server or a volume must be mounted at this mount point.

## Deployment

The service can basically be deployed in two ways: In standalone mode as a direct installation on the
server or on the cloud as a container.

### Standalone operation

Standalone operation requires a JavaScript runtime environment and thus a [Node.js](https://nodejs.org/en/)
installation. In version `1.x.x`, the Twaddle Platform requires a minimum Nodejs version of `16.x.x`. A runtime
version of the application must first be built. In addition to a JavaScript runtime environment, the build
tool [npm](https://www.npmjs.com/) is also required for this.

First, all dependencies are loaded from the package registry via npm. The dependencies are needed partly for
transpiling an executable version and partly for runtime operation.

```sh
$ npm run install
```

After that, a runtime version will be built.

```sh
$ npm run build
```

If an executable version is available, it can easily be started with the following command.

```sh
$ npm run start
```

For a successful start, the application, especially the external data sources, must also be configured.
See the configuration section above.

### Cloud operation

In addition to the standalone version, it is possible to start the application in a container. This has
the advantage that no Node.js installation is required. To do this, either an existing image must be loaded
from a registry, or a new Docker image of the application must be created.

A docker image can be created based on the attached dockerfile with the following command.

```sh
$ docker build -t twaddle/api:latest .
```

The result is a docker image which was stored in the local registry under the name `twaddle/api:latest`.
Depending on the orchestration system, the image can now be started in the form of a container. In its
simplest form, a container is created with the following command.

```sh
$ docker run -p <PORT>:3000/tcp -v <VOLUME>:/usr/local/bin/twaddle/api/resources:ro --name twaddle-api twaddle/api:latest
```

## License

Copyright (c) 2022 0x1C1B

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[MIT License](https://opensource.org/licenses/MIT) or [LICENSE](LICENSE) for
more details.

### Forbidden

**Hold Liable**: Software is provided without warranty and the software
author/license owner cannot be held liable for damages.
