# Database Management System Guide


## How to use Adminer
1. To start with, spin up all containers using the following command: 
```bash
$ docker compose --env-file ./.env up --build --force-recreate
``` 

2. Go to `localhost:8080` and fill out the fields as follow: 
- Make sure to choose `PostgreSQL for System`
- Server should have the value `db`
- Username should have the same value as that provided for the environment variable `POSTGRES_USER`
- Password should have the same value as that provided for the environment variable `POSTGRES_PASSWORD`
- Database should have the same value as that provided for the environment variable `POSTGRES_DB`

3. Click Login

4. To view the data for a table, click on the `select` hyperlink corresponding to the table that you want to view. 

5. To edit an entry, click `edit` hyperlink corresponding to the entry that needs to be edited. 

## How to use RedisInsight
1. To start with, spin up all containers using the following command: 
```bash
$ docker compose --env-file ./.env up --build --force-recreate
``` 

2. Go to `localhost:8001` and follow the prompt. 

3. Upon being provided an option to add a Redis connection, choose `I already have a database`. 

4. In the next prompt, choose `Connect to a Redis Database`. 

5. Fill out the form as follow: 
- Host: `redis-cache`
- Port: 6379
- Name: `redis-cache`
- Password field should have the same value as that provided for the environment variable REDIS_PASSWORD. 
- `Use TLS` checkbox should remain unchecked. 

6. Click `Add Redis Database` and you should have a connection to the Redis instance. 

7. To view data inside Redis cache, click on the created connection and choose `Browser` on the left navbar. 