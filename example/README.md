# 1. How can i start `redis` local by using `docker` ?

## Bootstrap a local Redis instance for testing purposes
## 
```
docker run -p 6379:6379 -d --name redis-anhdiepmmk-nestjs-cache-module -v redis-anhdiepmmk-nestjs-cache-module-data:/data redis
```

## Retrieve the logs from a Redis container
```
docker logs -f redis-anhdiepmmk-nestjs-cache-module
```

# 2. How can i bootstrap `example` project and developing this package ?

## 1. Install deps
```
npm install
```

## 2. Integrate `package` into `example` project
```
cd ../package
npm run watch
npm link
cd ../example
npm link @anhdiepmmk/nestjs-cache-module
```

## 3. Start `example`
```
npm run start:dev
```