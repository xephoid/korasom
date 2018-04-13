# korasom
Adventures in blockchain

## Installation

1. Install Truffle and Ganache globally.
    ```javascript
    npm install -g truffle ganache-cli
    ```

2. Installing the program dependencies.
    ```javascript
    npm i
    ```

3. Start Ganacheis.
    ```javascript
    ganache-cli
    ```
    
4. Ganache should produce 10 available accounts on a .    

4. In a separate window, compile and migrate the smart contracts.
    ```javascript
    truffle compile
    truffle migrate
    ```

5. Run the dev server for front-end hot reloading (outside the development console). Smart contract changes must be manually recompiled and migrated.
    ```javascript
    // Serves the front-end on http://localhost:3000
    npm run dev
    ```

6. Truffle can run tests written in Solidity or JavaScript against your smart contracts. Note the command varies slightly if you're in or outside of the development console.
  ```javascript
  // If inside the development console.
  test

  // If outside the development console..
  truffle test
  ```
