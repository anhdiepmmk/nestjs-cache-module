Nestjs cache module

- @CacheWrap
- @CacheDel
- @CacheDelAfter
- @CacheDelBefore

```
@CacheWrap({
    keyOrGenerator: 'hello-world',
    shouldWrap: (functionArgs): boolean | Function => {
        return true;
    }
})
```

```
TODO: // consider provide options shouldDeleteEvenAfterError, default true
@CacheDel({
    keyOrGenerator: 'hello-world',
    deleteWhen: 'before-trigger' | 'after-trigger'
    shouldDelete: (functionArgs, functionResult): boolean | Function => {
        return true;
    }
})
```

```
@CacheDelAfter({
    keyOrGenerator: 'hello-world',
    shouldDelete: (functionArgs, functionResult): boolean | Function => {
        return true;
    }
})
```

```
@CacheDelBefore({
    keyOrGenerator: 'hello-world',
    shouldDelete: (functionArgs): boolean | Function => {
        return true;
    }
})
```

```
@CacheSet({
    shouldSet: (functionArgs, functionResult): boolean | Function => {
        return true;
    }
})
```
