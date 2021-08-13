# require-hook
Allows you to change the result of `require`, by using hooks.
This package supports two types of hooks; scoped hook and a global hook.

# Scoped hook
A hook that is registered during the runtime of a scope.

**tester.js**
```javascript
const requireHook = require('devmcc-require-hook')

requireHook(
    // The hook function.
    (path, resolve) => {
        // Will resolve with the first argument.
        if (path == './test-module-function') {
            const mock = {
                get(arg) {
                    return 'mocked: ' + arg
                }
            }
            resolve(mock, true)
            return
        }

        // Will resolve with the original module.
        resolve()
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

# Global hook
A hook that is permantently registered until removed.

**hook.js**
```javascript
const requireHook = require('devmcc-require-hook')

// Calling requireHook without arguments will return the HookObject.
// The method "addHook" returns a HookKey.
const hookKey = requireHook().addHook((path, resolve) => {
    if (path == './test') {
        resolve('./fake')
    }
})

console.log(require('./test'))

// This will remove the hook.
requireHook().removeHook(hookKey)
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

## HookObject
The HookObject contains three methods:
* addHook - adds a global hook, returns a HookKey.
* removeHook - Removes a global hook based on the HookKey.
* getHooks - Returns a mapping of all the current hooks.

## Multiple hooks
It is possible to have multiple hooks, they will be invoked in chronological order.  
If one hook resolves, then all the other hooks will receive `undefined`, rather than a `resolve` function.

# Resolving modules
Calling `resolve` without arguments will resolve with the original module.  
Calling `resolve` with only a string will replace the import path, please keep in mind that the path is relative.  
Calling `resolve` with a second argument as `true` will resolve with the first argument.
