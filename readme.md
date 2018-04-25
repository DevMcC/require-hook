# require-hook
Allows you to hook the require function.

Using the interface you can set up hooks that can be used multiple activities. One of the most important one is manipulating the result of a module `require`.

Require-hook works by overwriting the original _require_ function with a custom one when you have registered a hook.

# The require-hook interface
In order to use require-hook, you will have to require the package by using the following code:
```javascript
const requireHook = require('devmcc-require-hook')
```

This will provide you with the require-hook interface, a function.

## Global hooking (hookObject)
Invoking the require-hook interface without any arguments will provide you with the hookObject, which containts several functions for you to use.

#### addHook
Invoking this method with a `hook function` will return a `hook-key`.

This means that your _hook function_ has been registered under the returned _hook-key_.

See below for more information regarding the _hook function_.

#### removeHook
Invoke this method with a _hook-key_ that you received from the `addHook` method to remove your _hook function_.

#### getHooks
Returns a mapping of all the currently active hooks.

## Scoped hooking
Invoking the require-hook interface with two functions (a `hook function` and a `scope function`) will automatically register the _hook function_ during the runtime of the _scope function_.

## Hook function
Your _hook function_ will be called every time when some code `require`s a module. This function should accept two arguments (`path` and `resolve`).

### {String} path
The path that has been passed to the _require_ function.

For example: `require('../something')` would provide _path_ as `'../something'`.

### {Function} resolve
The _resolve_ function may be used in multiple ways.

**invoking _resolve_ without arguments** will proceed to relay the _require_ invoke to the actual _require_ function.

**invoking _resolve_ with only a string** will proceed to invoke the actual _require_ function with the given path.  
**NOTE:** the path is still relative to the original code that called _require_.

**invoking _resolve_ with the second argument being `true`** will make the _require_ return the first argument as-is.

## Multiple hooks
It is possible to register multiple hooks, the hooked functions will be invoked in chronological order (the most recent hooked will be called last).

However, resolving before all the hooked functions have been invoked, will make all other hooked functions after it receive `undefined` under `resolve`.

# Examples
## Scoped hooking
**tester.js**
```javascript
const requireHook = require('devmcc-require-hook')

requireHook(
    // The hook function.
    (path, resolve) => {
        // Will regularly resolve the original module.
        if (path == './test-module') {
            return resolve()
        }

        // Will resolve a custom object as the dependency for the original module.
        resolve({
            get(arg) {
                return 'mocked: ' + arg
            }
        }, true)
    },
    // The scope function.
    () => require('./test-module')
)
```

**test-module.js**
```javascript
const mod = require('./test-module-function')

console.log(mod.get('abc'))
```

**test-module-function.js**
```javascript
module.exports = {
    get(arg) {
        return 'original: ' + arg
    }
}
```

Running **test-module.js** directly will output `original: abc`.  
Running **tester.js** will output `mocked: abc`.

## Global hooking
**hook.js**
```javascript
const requireHook = require('devmcc-require-hook')

requireHook().addHook((path, resolve) => {
    if (path == './test') {
        resolve('./fake')
    }
})

console.log(require('./test'))
```

**test.js**
```javascript
module.exports = 'test'
```

**fake.js**
```javascript
module.exports = 'fake'
```

Running **hook.js** will output `fake`.
