# BSG (Binary Search Gang)

## What is BSG?

BSG is an attempt to recreate **binarysearch.io**, a website that allows user to create rooms to practice solving coding interview problems with friends. 

## Main components

Currently, there are 3 main component of this application: 
- [Central Service](#central-service)
- [RTC Service](#rtc-service-realtime-communication)
- [Worker Service](#worker-service)

### Central Service
Central Service will contain all core business logic of BSG, including user authentication, database interaction, etc..

### RTC Service (Realtime Communication)
RTC Service will be a server that maintains socket connection between clients and the whole application for the purpose of delivering real-time notifications. 

### Worker Service
Worker Service will be responsible for carrying out computational-intensive tasks. 

## Setup the project for development

Create a copy of the file `.env.template` and name the copy as `.env`. In Linux or MacOS, one can run the following command: 
```bash
$ cp .env.template .env
```

Fill out the environment variables in the `.env` file with any value of choosing. 

Execute the following command to run the project: 
```bash
$ docker compose --env-file ./.env up --build --force-recreate
```