# Twaddle API

> Real time messenger and communication platform.

## Table of Contents

- [Introduction](#introduction)
- [Getting started](#getting-started)
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

![Architecture](docs/images/architecture.png)

### RESTful API

The RESTful interface is used to exchange static data such as user profiles or access data.
The communication is stateless based on the [HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc2616/)
protocol. The resources and endpoints are documented by the self-service documentation provided
by the service itself. See `/docs` of the service instance for details.

### Web Socket API

A web socket interface is used for reactive tasks such as real-time communication. This is based on
the [WebSocket](https://datatracker.ietf.org/doc/html/rfc6455) protocol or, based on it, on the
[Socket.IO](https://github.com/socketio/socket.io-protocol) protocol. The resources and events
are documented by the self-service documentation provided by the service itself. See `/docs` of the
service instance for details.

## Configuration

In principle, the service can be fully configured via environment variables. These can be given to
the service via the system environment when called or via an environment file. With regard to the
configuration, it should be mentioned that the service works with three different configuration
profiles: `development`, `test` and `production`. According to these profiles, the appropriate
environment file is also loaded.

### Environment Variables

The following variables are service parameters and affect the way it works.

| Variable                 | Description                                            | Required |
| ------------------------ | ------------------------------------------------------ | -------- |
| LOGGER_LEVEL             | Logging level to use during runtime                    | false    |
| LOGGER_FILENAME          | Optional file to which the logs are also written       | false    |
| DATABASE_URI             | URI of the MongoDB database used as primary data store | true     |
| CACHE_URI                | URI of the Redis instance used as secondary data store | true     |
| SECURITY_JWT_PUBLIC_KEY  | Path of the public key file for the JWT signing        | true     |
| SECURITY_JWT_PRIVATE_KEY | Path of the private key file for the JWT signing       | true     |
| SECURITY_JWT_ISSUER      | Identifier of the JWT issuer                           | true     |
| SECURITY_JWT_EXPIRES     | Validity period of a access token in seconds           | false    |
| SECURITY_TICKET_EXPIRES  | Validity period of a ticket in seconds                 | false    |

The following environment variables are not used directly by the Twaddle service, but by the
underlying system infrastructure such as the application server. Please note that only the
service-specific environment variables can be loaded from an environment file, but not the
following variables that affect the system infrastructure.

| Variable | Description                                                                 | Required |
| -------- | --------------------------------------------------------------------------- | -------- |
| NODE_ENV | Sets the environment profile, based on which the environment file is loaded | false    |
| PORT     | Sets the port of the underlying application server                          | false    |

### Envrionment Files

It is possible to load the environment variables from a file. Depending on the profile, this file must
be named as follows: `.env.<PROFILE>`. The file is expected to be found in the current working directory
of the process. The above variables are to be listed as key-value pairs per line, separated by an equals
sign.

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
