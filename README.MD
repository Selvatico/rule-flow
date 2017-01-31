## Logic
Inspiration module: [node-rules npm repo](https://www.npmjs.com/package/node-rules)

###Rule
`flow/lib/rule.js`

Each rule on beginning is simple JS object with next fields:

* `name` - rule name
* `priority` - determine in which sequence rules will be applied. Use hundreds for better flexibility
* `condition` - function which check some condition based on provided `fact`. As second parameter always receive link to current execution session. Could return a `Promise`. Condition considered as met if it return something other than `false`, `undefined`, `null` (for Promise bases - Promise should be resolved with any value other than listed above).
* `consequence` - function which executed once condition is met. It could return some result (currently supported Redirect result), it could alter fact or do any other actions (e.g. set something to session etc.). Receives 2 parameters - `fact` - data which used to check against a rules, `Flow` - current session instance. 
* `group` - to distinguish and group rules by features, flows etc.

Rules executed one by one until any of rule `consequence` call `Flow.stop()` method or `Flow` detects infinity loop.

### Flow
Is session for execution one by one rules according their priority with given fact until some of the rules will stop the flow.

*Important:* If rules will not call the `.stop()` method rules would be executed until stop by count of execution.

API:

* `.next()` - move to next rule
* `.jumpTo(name)` - switch to rule with given name
* `.run()` - start flow - should not be called directly.
* `.stop()` - stop execution of the flow
* `.restart()` - restart index to zero and start flow from beginning.
* `.executionPath` - property which stores execution path and rules which checked
* `.matchPath` - property which stores all rules where condition was met and we executed `consequence` function.


###Engine
`flow/lib/engine.js`
Represents exposed via plugin to run flow sessions.

API:

* `.execute(fact)` - start flow session and return Promise which resolved with object with next properties:
    * `.fact` - data passed for execution.Could be altered inside the rules
    * `.matchPath` - array of rules names for which we met conditions
    * `.result` - result of execution if specified by `consequence` (e.g. Redirect etc.) 
    * `.lastMatched` - last matched rule name
* `.executeFlow(fact, tags)` - executes rules with possibility to match by tag.

All other methods of engine is self-explanatory.

### Examples:

To see full output of Engine flow check use global env variable `DEBUG` with value `flow*`.
In this case will be visible whole sequence and flow of checks

#### Pure javascript execute
```javascript
const rules = [
    {
        name: 'super-rule',
        priority: 101,
        // If condition return anything which could be considered not as false (not null, undefined etc..) it considered as macthed
        condition(fact) {
            return fact.field === true;
        },
        // If condition met consequence function is executed
        consequence(fact, Flow) {
            // we could stop checking other rules
            Flow.stop(); 
            // Return some result add to plugin via result extension
            // Bu default module doesn't contain any results
            return Flow.result('redirect', { url: 'https://google.com' });
        }
    }
];
const R = new Engine();
const data = {field : true };
R.register(rules);
R.execute(data)
  .then(({ result, matchPath, lastMatched, fact }) => {
        // matchPath - array of rules checked before stop
        // lastMatched - rules executed last and it could be that this rule stoped execution
        // fact - data passed to execute, rules could alter data inside
        
        if (result) {
           // Results added to plugin could extend functionality and receive parameters to use them inside result
           result.run(/*param1, param2*/);   
        }
    });
```

