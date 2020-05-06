# cafe_system
A small CLI with API included to sort and optimize orders from a coffee shop selling system

### Instalation and first steps

First make sure you have installed the latest [Node.js](https://nodejs.org/) and npm versions in your machine.

Once you unzipped/cloned the project, from inside the project folder run

```sh
$ npm install
```
And if you want to globally enable the CLI, run

```sh
$ npm link
```
That will create a symmlink so you can access the CLI commands from anywhere in the system. If you want to remove this symmlink for whatever reason, do so by running

```sh
$ npm rm --global cafe_sys 
```

### CLI

**Table of contents**

| Command/Flag | Short | Description | Type | Default | Needed |
| --- | --- | --- | --- | --- | --- |
| cafe-asymm | None | Starts the program | None | None | YES |
| - -logInput | -l | Logs the input the user selected | Boolean | false | NO |
| - -verbose | -v | Logs complete error messages catched in the runtime if any | Boolean | false | NO |
| - -data | -d | Input JSON file. Expects relative path to file | String | None | YES |
| - -method | -m | Tells which type of algorithm to use. Posible values: "optimized", "fifo"  | Enum | fifo | YES |

**Usage**

You can run a very basic example with all defaults by just running `cafe-asymm`. If you do this, the program is then gonna ask you to choose a method to use and a path to a valid JSON input file.

A more elaborated command

```sh
cafe-asymm -d ./cafe_system/input_fifo.json -m optimized -l -v 
```
tells the program to search for a "input_fifo.json", to use the "optimized" method, to log the input data, as well as the expected output and to log the complete error messages if there were any while evaluating the program's tasks.

Or run

```sh
cafe-asymm -d ./cafe_system/input_fifo.json -m optimized
```
for minimal commands and to avoid further questioning.

**Added functionality**

> "Asymm Cafe might want to use pieces of your program in a real-world situation where the entire list of orders isn't given at one time."

Whenever an iteration is completed, after the output of the program is logged, this will ask if it should take a new order in to mix with the ones already registered and processed. If you choose to do so, it will ask what kind of drink and order time to use.

This approach tries to mimic a real world situation in which, a barista dispatches each new order at different points in time throughout the day, making use of a dashboard or a easy-to-use UI. 

Using this utility, you can see, with each new iteration you choose to make, how the times, orders, profits and starting times stack up. Useful also for testing purposes. 

**Other considerations when using the CLI**

When using the 'logInput' combined with the 'optimized' algorithm, the program also outputs the optimized input for testing purposes.

When using the 'optimized' algorithm you also get a small analitics report at the end of the logged successful output.

Each validation task is rendered successful or unsuccessful in the terminal. In this way, you know exactly what went wrong with the program if, say, for example, the input data was not valid. 

### Project Structure

The program is structred and written in a way that all the CLI logic is separated from the logic of the sorting and optimization algorithms. In this manner one can take out just the modules that hold sorting related logic to work with those methods alone.

* bin folder
  - __cafe-asymm folder__ - Only holds logic to let this project run a CLI using a specific library.
* src folder
  - __cli folder__ 
    - __index.js__ - Stores all the logic needed to declare the program's CLI flags and create questions to gather input.
    - __tasks.js__ - Takes care of all the steps involved in a program's iteration as well as manage how output is rendered in the terminal.
  - __constants folder__ - Stores the Menu object used in the program.
  - __methods folder__
    - __coffeShop.js__ - Class that stores the methods for sorting and assigning orders .
    - __helpers.js__ - Super class that's inherited in CoffeShop and Optimizer to provide aditional functionality and avoid code duplication of methods.
    - __optimizer.js__ - Class that manages methods only used in the optimized algorithm
    - __validator.js__ - Class that stores all the methods to validate file existance, input data, extension type, data value types and data props names.
  - __tests folder__ - Stores the .json files (cases) used when testing the program

Downside to this approach is that all the validation logic, modular as it is, is not directly included in the sorting methods. Meaning to say that, if the Methods library was taken out of this project, all the functions have no validation of any kind and may be prone to error if not given the exact input they are expecting. The last is because I needed to put the validation logic as soon as the input was received from the CLI, and this is at the cli/tasks.js file where all i/o is managed. 

Sure you can also make use of the validator class to validate your input before you pass it on to the sorting methods. 

> "Why using classes for your methods instead of libraries of functions?"

I believe that, by using classes, inheritance and abstraction to manage all the methods I need to solve the algorithms, it gives the code far more readability and a more clean look. In this way you can see right away which method comes from which class. Furthermore, abstraction allowed me to easily share and reuse all my methods, when possible and viable, so I didn't duplicate a single line of code and, on top of this, kept a really organized structure among methods so everything is where it belongs. All the validation methods inside a single class, all the sorting related methods in its own class, all the optmizing methods on its own class, and so on. 

### Optimization metrics

My optimization algorithm focuses on particular cases it may happen along the way. Specifically when multiple orders are dispatched at the same time, (what I called 'bottlenecks'). So I made an algorithm that is capable of prioritizing orders inside bottlenecks based on its profitability.

The way I did it, was firstly, based on the menu, creating this new property called profitability, which can be translated as "profit made per unit of time". The brews with the higher profitability, have higher priority in bottlenecks. 

How I calculate profitability and further explanations can be found in the codes of the  **optimizer.js** class. 

Once I calculated the priority of each brew based on its profitability. I rearranged the orders so I grouped the bottlenecks in arrays that share the same "order_time" prop. Once I did that, I iterate through each of those bottlenecks lists to reorder them, so the most profitable ones, stayed at the beggining of the list. 

So in relatively long bottlenecks, say, more than 5 or 6 orders with the same time order, it is most likely that, the order "n", is not necessarily the one after order "n - 1".

**Other implementations**

When using this algorithm, with each new iteration, you get some analitics to check: average waiting time throughout all the orders, number of drinks made and profits made. This with the intention to show how the algoritm impacts those variables.

**Downsides to this approach**

Well, for one, it is not a very realistic approach. For now, the bottlenecks are grouped by just matching their order time property. In a real life situation, the order time, is never exactly the same, rather it should look for orders that share 5 or 6 minutes of difference between each other. 

Another thing is that it is only focused on profits. Imagining a case in which the most profitable brew is also the one that takes the longest to make, I would end up with a lot of people waiting in line just so I can dispatch first the orders I find most convenient for my wallet, and that translates to unhappy customers. 

### Test Cases

You can find the test cases inside the src/tests folder and you can use your own to test the level of validation of the program. 

* __incorrect_data_types.json__ - Case where the object values in one or more list items are not the expected.
* __input_exceeds_time_100.json__ - Case when the amount of orders are enough so they exceed the limit of time = 100.
* __input_fifo.json__ - Input provided by challenge's author.
* __missing_props.json__ - Case when one or more list items are missing necessary props.
* __not_valid_json.json__ - Case when the input file is not in valid json format.
* __order_times_after_100.json__ - Case when any given order is made after t = 100.
* __FILE NOT FOUND__ - Validation also checks first if the file really exists at given path.

Should any of these cases come to happen, the program logs the error and then crashes. 

With the only excepetion of the __input_exceeds_time_100.json__ case. In that case, the program runs fine and at the end, creates a special log that shows exactly which orders were not able to be made because of its time restriction. 

### Round up and room for improvement

This was quite a challenge and I loved writing it at every step of the way. 

*Things that I'd love to have implemented:* 
* CLI flag to also accept the Menu as a parameter, so you can work with different brews.
* A second implementation algorithm that arranges orders in a way that the average waiting time is as small as possible.
* Publish this repo as an NPM module. In that way, one could `npm install @myModule` and use any of the methods I made inside any other javascript project by simply `import { methodOne, methodTwo } from '@myModule';`. 
* Make a complete API documentation of every single one of the methods I created in all the classes this software uses.
* Use a library like Jasmine or Jest to make all the needed test suites for this software.

Regardless, this was as much time as I was willing to put on this project. 


License
----

MIT