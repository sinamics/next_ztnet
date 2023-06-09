[![GithubCI](https://github.com/sinamics/next_ztnet/actions/workflows/ci-tag.yml/badge.svg)](https://github.com/sinamics/next_ztnet/actions)
[![Release](https://img.shields.io/github/v/release/sinamics/next_ztnet.svg)](https://github.com/sinamics/next_ztnet/releases/latest)
[![Docker Pulls](https://img.shields.io/docker/pulls/sinamics/next_ztnet.svg)](https://hub.docker.com/r/sinamics/next_ztnet/)

# Next ZTnet

Next ZTNet is a ZeroTier controller that provides an easy-to-use interface for managing your ZeroTier networks. Built with Next.js, Prisma, tRPC, TypeScript, Tailwind CSS, and DaisyUI, this powerful web application simplifies the process of creating, configuring, and monitoring your ZeroTier networks.

With Next ZTNet, you can:

- Create and manage multiple ZeroTier networks
- Monitor network status and connected nodes
- Easily add and remove nodes from your networks
- Configure network settings such as IP ranges, routes, and access control

## Table of Contents

- [Next ZTnet](#next-ztnet)
  - [⚠️ This project is currently under development and not yet suitable for production environments.](#️-this-project-is-currently-under-development-and-not-yet-suitable-for-production-environments)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installations](#installations)
    - [Using Docker Compose](#using-docker-compose)
    - [Note! First user that register will be automatically assigned as admin.](#note-first-user-that-register-will-be-automatically-assigned-as-admin)
    - [Environment Variables](#environment-variables)
- [Development](#development)
  - [vscode container development (recommended)](#vscode-container-development-recommended)
  - [The traditional way](#the-traditional-way)
    - [Setup Environment Variables](#setup-environment-variables)

## Features

- Create and manage multiple ZeroTier networks
- Monitor network status and connected nodes
- Easily add and remove nodes from your networks
- Configure network settings such as IP ranges, routes, and access control

## Installations

### Using Docker Compose

You don't need to clone the repository to use Next ZTNet with Docker. Instead, create a `docker-compose.yml` file in your local machine with the following content:

```yaml
version: "3.1"
services:
  postgres:
    image: postgres:15.2-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ztnet
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  zerotier:
    image: zyclonite/zerotier:1.10.6
    hostname: zerotier
    container_name: zerotier
    restart: unless-stopped
    volumes:
      - zerotier:/var/lib/zerotier-one
    cap_add:
      - NET_ADMIN
      - SYS_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    networks:
      - app-network
    ports:
      - "9993:9993/udp"
    environment:
      - ZT_OVERRIDE_LOCAL_CONF=true
      - ZT_ALLOW_MANAGEMENT_FROM=172.31.255.0/29

  next_ztnet:
    # image: sinamics/next_ztnet:latest-dev   # Use this for testing latest development build
    image: sinamics/next_ztnet:latest
    container_name: ztnet
    platform: "linux/amd64"
    working_dir: /app
    volumes:
      - zerotier:/var/lib/zerotier-one:ro
    restart: unless-stopped
    ports:
      - 3000:3000
    environment:
      ZT_ADDR: http://zerotier:9993
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
      NEXTAUTH_URL: "http://localhost:3000"
      NEXTAUTH_SECRET: "random_secret"
    networks:
      - app-network
    links:
      - postgres
    depends_on:
      - postgres
      - zerotier
volumes:
  zerotier:
  postgres-data:

networks:
  app-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.31.255.0/29
```

Next, run the following command in the same directory as the `docker-compose.yml` file:

`docker-compose up -d`

This will pull the required images, create the containers, and start the services.

You can now access the Next ZTNet web interface at `http://localhost:3000`.

### Note! First user that register will be automatically assigned as admin.

### Environment Variables

The `docker-compose.yml` file includes several environment variables that you can customize based on your needs. Here is a description of each variable:

- `POSTGRES_HOST`: The hostname of the PostgreSQL service.
- `POSTGRES_PORT`: The port number for the PostgreSQL service.
- `POSTGRES_USER`: The username for the PostgreSQL database.
- `POSTGRES_PASSWORD`: The password for the PostgreSQL database user.
- `POSTGRES_DB`: The name of the PostgreSQL database.
- `NEXTAUTH_URL`: The URL for NextAuth authentication.
- `NEXTAUTH_SECRET`: The secret key for NextAuth authentication.

These are system environment variables used by the ZeroTier service and should not be changed:

- `ZT_OVERRIDE_LOCAL_CONF`: Allows overriding local ZeroTier configuration.
- `ZT_ALLOW_MANAGEMENT_FROM`: Defines the IP range allowed to access the ZeroTier management interface.
- `ZT_ADDR`: The address of the ZeroTier service.

To change any of these values, update the corresponding environment variable in the `docker-compose.yml` file.

# Development

## vscode container development (recommended)

1. Install [Visual Studio Code](https://code.visualstudio.com/) and the [Remote Development Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack).
2. Clone this repository.
3. Open the repository in Visual Studio Code.
4. Select **Remote-Containers: Open Folder in Container...** from the Command Palette (<kbd>F1</kbd>).
5. Select **Reopen in Container** when prompted.
6. Once the container is running, hit (<kbd>F1</kbd>) and type Task to open the task menu.
7. Select **Install dependencies packages** to install all the dependencies.
8. Select **Start Development Server** to start the development server.
9. Open browser and go to `http://localhost:3000`.

**NOTE:** Hot reloading on Windows may not be as performant as on other operating systems. If you encounter sluggish hot reloading, consider setting the environment variable WATCHPACK_POLLING=true. However, for optimal performance, we strongly suggest utilizing the **Windows Subsystem for Linux (WSL)** to develop your application. This approach will provide a swift and seamless hot reload experience, allowing you to focus on coding rather than waiting for the application to reload.

## The traditional way

To start development, first, clone the repository:

`git clone https://github.com/yourusername/next_ztnet.git
cd next_ztnet`

### Setup Environment Variables

Create a `.env` file in the root of the project and set the necessary environment variables:

- `POSTGRES_HOST`=localhost
- `POSTGRES_PORT`=5432
- `POSTGRES_USER`=postgres
- `POSTGRES_PASSWORD`=postgres
- `POSTGRES_DB`=ztnet
- `NEXTAUTH_URL`=http://localhost:3000
- `NEXTAUTH_SECRET`="your_nextauth_secret"
- `MIGRATE_POSTGRES_DB`="shaddow_ztnet"
- `MIGRATE_DATABASE_URL`="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${MIGRATE_POSTGRES_DB}?schema=public"
  You need to run the following command to create the database:

`npx prisma db push`

Now start the development server:

`npm run dev`
