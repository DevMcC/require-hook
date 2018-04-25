const chai = require('chai')
    , spies = require('chai-spies')
    , requireHook = require('../index')

chai.use(spies)

describe('export function', function() {
    it('should return true when invoking with both arguments as type of Function', function() {
        const test = () => {}
        chai.assert.isTrue(requireHook(test, test))
    })

    it('should return an object when invoking with incorrect arguments', function() {
        chai.assert.equal(typeof requireHook('123'), 'object')
    })
    
    it('should return an object when invoking without arguments', function() {
        chai.assert.equal(typeof requireHook(), 'object')
    })
})

describe('hook object', function() {
    // all these tests in here are in pairs with eachother.
    let hookKey = undefined

    describe('#addHook', function() {
        it('should return false when invoking without a closure', function() {
            chai.assert.isFalse(requireHook().addHook())
            chai.assert.isFalse(requireHook().addHook('123'))
        })

        it('should return string when invoking with closure', function() {
            test = () => {}
            hookKey = requireHook().addHook(test)
            chai.assert.equal(typeof hookKey, 'string')
        })
    })

    describe('#getHooks', function() {
        it('should return object when invoking', function() {
            chai.assert.equal(typeof requireHook().getHooks(), 'object')
        })

        it('should contain hookKey from #addHook', function() {
            chai.assert.equal(typeof requireHook().getHooks()[hookKey], 'function')
        })
    })

    describe('#removeHook', function() {
        it('should return false when invoking with wrong key', function() {
            chai.assert.isFalse(requireHook().removeHook())
            chai.assert.isFalse(requireHook().removeHook('123'))
        })

        it('should return true when invoking with hookKey from #addHook', function() {
            chai.assert.isTrue(requireHook().removeHook(hookKey))
        })

        it('should return false when invoking again with hookKey from #addHook', function() {
            chai.assert.isFalse(requireHook().removeHook(hookKey))
        })
    })

    describe('#getHooks after #removeHook', function() {
        it('should not contain hookKey from #addHook', function() {
            chai.assert.equal(typeof requireHook().getHooks()[hookKey], 'undefined')
        })

        it('should be empty', function() {
            chai.expect(requireHook().getHooks()).to.eql({})
        })
    })
})

describe('hooks', function() {
    describe('scoped hooks', function() {
        it('should invoke scope function', function() {
            const test = () => {}
            const scope = chai.spy()

            requireHook(test, scope)

            chai.expect(scope).to.have.been.called(1)
        })

        it('should have a hook while in scope', function() {
            const test = () => {}
            const scope = () => {
                chai.expect(requireHook().getHooks()).to.not.eql({})
            }

            requireHook(test, scope)
        })

        it('should have a hook before Promise resolve/reject', function() {
            const test = () => {}
            const scope = () => {
                return new Promise((resolve, reject) => {
                    chai.expect(requireHook().getHooks()).to.not.eql({})

                    resolve()
                })
            }
        })

        it('should have no hooks after Promise resolve', function() {
            const test = () => {}
            const scope = () => {
                return new Promise((resolve, reject) => {
                    resolve()
                    chai.expect(requireHook().getHooks()).to.eql({})
                })
            }
        })

        it('should have no hooks after Promise reject', function() {
            const test = () => {}
            const scope = () => {
                return new Promise((resolve, reject) => {
                    reject()
                    chai.expect(requireHook().getHooks()).to.eql({})
                })
            }
        })

        describe('hook', function() {
            it('should not invoke hook function by default', function() {
                const hook = chai.spy()
                const test = () => {}

                requireHook(hook, test)
                chai.expect(hook).to.not.have.been.called()
            })

            // file c4ca4238a
            it('should invoke hook function after scope attempts to require a file', function() {
                const hook = chai.spy()
                const scope = () => {
                    require('./require-tests/scope-file-c4ca4238a')
                }

                requireHook(hook, scope)
                chai.expect(hook).to.have.been.called(1)
            })

            // file c81e728d9
            it('should invoke hook function with the arguments `path` and `resolve`', function() {
                const hook = (path, resolve) => {
                    chai.assert.equal(path, './require-tests/scope-file-c81e728d9')
                    chai.assert.equal(typeof resolve, 'function')
                }

                const scope = () => {
                    require('./require-tests/scope-file-c81e728d9')
                }

                requireHook(hook, scope)
            })

            // file 2deb000b5
            it('should restore require when all hooks are gone', function() {
                const test = () => {}

                requireHook(test, test)
                chai.assert.equal(require('./require-tests/scope-file-2deb000b5'), '2deb000b5')
            })

            // file 1f73402c6
            it('should require nothing when resolve is not invoked', function() {
                let result = 1
                const hook = (path, resolve) => {}
                const scope = () => {
                    result = require('./require-tests/scope-file-1f73402c6')
                }

                requireHook(hook, scope)
                chai.assert.equal(result, undefined)
            })

            // file bee3d0732
            it('should require original file when hook invokes resolve without arguments', function() {
                let result = undefined
                const hook = (path, resolve) => {
                    resolve()
                }

                const scope = () => {
                    result = require('./require-tests/scope-file-bee3d0732')
                }

                requireHook(hook, scope)
                chai.assert.equal(result, 'bee3d0732')
            })

            // file a9da342b7
            it('should require new file when hook invokes resolve with a new path', function() {
                let result = undefined
                const hook = (path, resolve) => {
                    resolve('./require-tests/scope-file-a9da342b7.1')
                }

                const scope = () => {
                    result = require('./require-tests/scope-file-a9da342b7')
                }

                requireHook(hook, scope)
                chai.assert.equal(result, 'a9da342b7.1')
            })

            // file 189810627
            it('should let resolve return false when path argument is not a string', function() {
                let result = undefined
                const hook = (path, resolve) => {
                    result = resolve(123)
                }

                const scope = () => {
                    require('./require-tests/scope-file-189810627')
                }

                requireHook(hook, scope)
                chai.assert.isFalse(result)
            })

            // file 79344fdd1
            it('should be able to support deep requires', function() {
                let result = undefined
                const hook = chai.spy((path, resolve) => resolve())
                const scope = () => {
                    result = require('./require-tests/scope-file-79344fdd1')
                }

                requireHook(hook, scope)
                chai.assert.equal(result, '79344fdd1.1')
                chai.expect(hook).to.have.been.called(2)
            })

            // file 68317811d
            it('should require second file with newPath when newPath is relative to first require when deep requiring', function() {
                let result = undefined
                const hook = chai.spy((path, resolve) => {
                    if (path == './scope-file-68317811d.1') {
                        return resolve('./scope-file-68317811d.2')
                    }

                    resolve()
                })
                const scope = () => {
                    result = require('./require-tests/scope-file-68317811d')
                }

                requireHook(hook, scope)
                chai.assert.equal(result, '68317811d.2')
            })

            // file bae60998f
            it('should throw an error if newPath for second require is not relative to first require when deep requiring', function() {
                const hook = chai.spy((path, resolve) => {
                    if (path == './scope-file-bae60998f.1') {
                        return resolve('./require-tests/scope-file-bae60998f.2')
                    }

                    resolve()
                })
                const scope = () => {
                    require('./require-tests/scope-file-bae60998f')
                }

                chai.expect(() => requireHook(hook, scope)).to.throw(Error, 'Cannot find module \'./require-tests/scope-file-bae60998f.2\'')
                chai.expect(requireHook().getHooks()).to.eql({})
            })

            // file 0dad7394d
            it('should let resolve return true when invoked', function() {
                result = undefined
                const hook = (path, resolve) => result = resolve()
                const scope = () => {
                    require('./require-tests/scope-file-0dad7394d')
                }

                requireHook(hook, scope)
                chai.assert.isTrue(result)
            })

            // file ea7bfeb25
            it('should let resolve return true when invoked with a string', function() {
                result = undefined
                const hook = (path, resolve) => result = resolve('./require-tests/scope-file-ea7bfeb25.1')
                const scope = () => {
                    require('./require-tests/scope-file-ea7bfeb25')
                }

                requireHook(hook, scope)
                chai.assert.isTrue(result)
            })

            // file d804fe622
            it('should return first argument to the invoke of resolve if the second argument is true', function() {
                result = undefined
                const hook = (path, resolve) => resolve('returned', true)
                const scope = () => {
                    result = require('./require-tests/scope-file-d804fe622')
                }

                requireHook(hook, scope)
                chai.assert.equal(result, 'returned')
            })

            // file 421d6bd2d
            it('should let resolve return true when invoked with the second argument being true', function() {
                result = undefined
                const hook = (path, resolve) => result = resolve('returned', true)
                const scope = () => {
                    require('./require-tests/scope-file-421d6bd2d')
                }

                requireHook(hook, scope)
                chai.assert.isTrue(result)
            })

            // file 40d415b2f
            it('should not break when multiple scoped hooks are nested', function() {
                const hook1 = chai.spy((path, resolve) => {
                    if (path == './require-tests/scope-file-40d415b2f') {
                        resolve()
                    }
                })
                const hook2 = chai.spy((path, resolve) => resolve())
                const scope = () => {
                    require('./require-tests/scope-file-40d415b2f')

                    const scope = () => {
                        require('./require-tests/scope-file-40d415b2f.1')
                    }

                    requireHook(hook2, scope)
                }

                requireHook(hook1, scope)
                chai.expect(hook1).to.have.been.called(2)
                chai.expect(hook2).to.have.been.called(1)
                chai.expect(requireHook().getHooks()).to.eql({})
            })
        })
    })
    
    describe('global hooks', function() {
        // file 02ccdf27a
        it('should call the hook function when code requires', function() {
            const hook = chai.spy((path, resolve) => resolve())
            let key = requireHook().addHook(hook)

            require('./require-tests/global-file-02ccdf27a')

            chai.expect(hook).to.have.been.called(1)
            requireHook().removeHook(key)
        })

        // file 8fc1b629c
        it('should call multiple hook functions when code requires', function() {
            const hook1 = chai.spy((path, resolve) => {})
            const hook2 = chai.spy((path, resolve) => {})
            let key1 = requireHook().addHook(hook1)
            let key2 = requireHook().addHook(hook2)

            require('./require-tests/global-file-8fc1b629c')

            chai.expect(hook1).to.have.been.called(1)
            chai.expect(hook2).to.have.been.called(1)
            requireHook().removeHook(key1)
            requireHook().removeHook(key2)
        })

        // file 07faff8e6
        it('should only send resolve to the first hook function as was resolved', function() {
            let result = 1
            let key1 = requireHook().addHook((path, resolve) => resolve())
            let key2 = requireHook().addHook((path, resolve) => result = resolve)

            require('./require-tests/global-file-07faff8e6')

            chai.assert.equal(result, undefined)
            requireHook().removeHook(key1)
            requireHook().removeHook(key2)
        })
    })

    describe('global/scope hooks', function() {
        // file b059c688f
        it('should be able to combine global and scope hooks', function() {
            const hook1 = chai.spy(() => {})
            const hook2 = chai.spy(() => {})
            const scope = () => require('./require-tests/file-b059c688f')
            let key = requireHook().addHook(hook1)
            
            requireHook(hook2, scope)
            chai.expect(hook1).to.have.been.called(1)
            chai.expect(hook2).to.have.been.called(1)
            requireHook().removeHook(key)
        })

        // file 21afa251d
        it('should be able to call hooks in a consistent order', function() {
            const callOrder = []
            const hook1 = chai.spy(() => callOrder.push('hook1'))
            const hook2 = chai.spy(() => callOrder.push('hook2'))
            const hook3 = chai.spy(() => callOrder.push('hook3'))
            const scope = () => require('./require-tests/file-21afa251d')
            let key1 = requireHook().addHook(hook1)
            let key2 = requireHook().addHook(hook2)

            requireHook(hook3, scope)
            chai.expect(hook1).to.have.been.called()
            chai.expect(hook2).to.have.been.called()
            chai.expect(hook3).to.have.been.called()
            requireHook().removeHook(key1)
            requireHook().removeHook(key2)

            // The recently created hook should be called as last.
            chai.assert.deepEqual(callOrder, ['hook1', 'hook2', 'hook3'])
        })
    })
})

describe('export function - advanced', function() {
    it('should return true when scope returns Promise', function() {
        const test = () => {}
        const scope = () => {
            return new Promise((resolve, reject) => {
                resolve()
            })
        }

        chai.assert.isTrue(requireHook(test, scope))
    })
})
