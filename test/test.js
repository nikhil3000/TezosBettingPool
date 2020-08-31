const assert = require('assert');
const conseiljs = require('conseiljs');
const config = require('../config.json');
const fs = require('fs');
const chai = require('chai').use(require('chai-as-promised'));
// const axios = require('axios');
const { Tezos } = require('@taquito/taquito');
const addresses = require('../address.json');
const {
  sleep,
  deployContract,
  callEntryPoint,
  tezosNode,
} = require('./testUtil');
Tezos.setProvider({ rpc: tezosNode });
chai.should();

// important, do not delete
require.extensions['.tz'] = function (module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};
console.log(
  'Running tests \n make sure to update config file and run npm sync and npm compile'
);
// let bettingPoolContractAddress = 'KT1NJBLjwzB3gmzEHPMRX3MuH9xgPZMQRr3G';
// let oracleAddress = 'KT1EwY2UKiMqWJeTYm3qV5RLeWXCkQFwQuyD';
let { oracleAddress, bettingPoolContractAddress } = addresses;
const key = [];
key.push(require('../keystore/key1'));
key.push(require('../keystore/key2'));
key.push(require('../keystore/key3'));
key.push(require('../keystore/key4'));
key.push(require('../keystore/key5'));
key.push(require('../keystore/key6'));
key.push(require('../keystore/test_key1'));
key.push(require('../keystore/test_key2'));

describe('deploy', async function () {
  // deploy all the contracts here
  this.timeout(0);

  const bettingPoolContract = require('../contract_build/bettingPool_compiled.tz');
  const bettingPoolStorage = require('../contract_build/bettingPool_storage_init.tz');
  const oracleContract = require('../contract_build/cycleOracle_compiled.tz');
  const oracleStorage = require('../contract_build/cycleOracle_storage_init.tz');

  it('Oracle Contract: Should deploy', async function () {
    const result = await deployContract(
      oracleContract,
      oracleStorage,
      key[1],
      1
    );
    console.log(
      `Injected operation ! \n  Oracle Contract Deployed with group ID : ${result.operationGroupID}`
    );
    console.log(
      `Contract Address : ${result.results.contents[0].metadata.operation_result.originated_contracts[0]} \n`
    );
    oracleAddress =
      result.results.contents[0].metadata.operation_result
        .originated_contracts[0];
  });
  it(' BettingPool Contract : Should deploy sucessfully', async function () {
    const result = await deployContract(
      bettingPoolContract,
      bettingPoolStorage,
      key[0],
      1
    );
    console.log(
      `Injected operation ! \n Betting Pool Contract Deployed with group ID : ${result.operationGroupID}`
    );
    console.log(
      `Contract Address : ${result.results.contents[0].metadata.operation_result.originated_contracts[0]} \n`
    );
    bettingPoolContractAddress =
      result.results.contents[0].metadata.operation_result
        .originated_contracts[0];
  });
  // it(' Adding Baker', async function () {
  //   await sleep(30000);
  //   const result = await callEntryPoint(
  //     bettingPoolContractAddress,
  //     `(Right (Left (Right (Some "tz1NRTQeqcuwybgrZfJavBY3of83u8uLpFBj"))))`
  //   );
  //   console.log(
  //     `Injected operation ! \n Contract Deployed with group ID : ${result.operationGroupID}`
  //   );
  //   console.log(
  //     `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
  //   );
  // });
  it(' Adding Oracle Address', async function () {
    await sleep(30000);
    const result = await callEntryPoint(
      bettingPoolContractAddress,
      `(Right (Right (Left "${oracleAddress}")))`
    );
    console.log(
      `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
    );
    let obj = {
      oracleAddress,
      bettingPoolContractAddress,
    };
    fs.writeFileSync('./address.json', JSON.stringify(obj), (err) => {
      if (err) console.log(err);
    });
  });
});

describe('functions', async function () {
  this.timeout(0);
  it('Deposit Funds', async () => {
    const result = await callEntryPoint(
      bettingPoolContractAddress,
      `(Left (Left (Right Unit)))`,
      key[0],
      10 ** 7
    );
    console.log(
      `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
    );
  });
  // it('tempBet', async () => {
  //   let promiseList = [];
  //   let res = await callEntryPoint(
  //     bettingPoolContractAddress,
  //     `(Left (Right (Right (Pair 5 ${
  //       Math.floor(Math.random() * 100000) + 1
  //     }))))`,
  //     key[1],
  //     5 * 10 ** 6
  //   );
  // console.log(temp.operationGroupID);
  // promiseList.push(temp);

  // const resolve = await Promise.all(promiseList);
  // console.log(resolve);
  // resolve.forEach((res) => {
  // console.log(res);
  // });
  // });
  it('Creating Bets', async () => {
    let promiseList = [];

    key.forEach(async (_key) => {
      if (_key != key[0]) {
        let temp = callEntryPoint(
          bettingPoolContractAddress,
          `(Left (Right (Right (Pair 5 ${
            Math.floor(Math.random() * 100000) + 1
          }))))`,
          _key,
          5 * 10 ** 6
        );
        // console.log(temp.operationGroupID);
        promiseList.push(temp);
      }
    });
    const resolve = await Promise.all(promiseList);
    // console.log(resolve);
    resolve.forEach((res) => {
      console.log(res.operationGroupID);
    });
  });
  // it('Update cycle Number', async () => {
  //   await sleep(30000);
  //   const data = await callEntryPoint(
  //     bettingPoolContractAddress,
  //     ` (Left (Right (Left 6)))`,
  //     key[0]
  //   );
  //   console.log(data.operationGroupID);
  // });
  it('Complete Bet', async () => {
    const contractInstance = await Tezos.contract.at(
      bettingPoolContractAddress
    );
    const storage = await contractInstance.storage();
    const poolSize = storage.betData.get('5').get('268');

    console.log('pool size', poolSize.senderList.length);
    const operation = await callEntryPoint(
      bettingPoolContractAddress,
      `(Left (Left (Left (Pair 268 5))))`,
      key[3],
      0,
      poolSize.senderList.length * 15000 + 500000
    );
    console.log(operation.operationGroupID);
  });
  it('Wrong BetType', async () => {
    // await sleep(30000);
    return callEntryPoint(
      bettingPoolContractAddress,
      `(Left (Right (Right (Pair 6 ${
        Math.floor(Math.random() * 100000) + 1
      }))))`,
      key[1],
      5 * 10 ** 6
    ).should.be.rejected;
  });
  it('Wrong BetAmount', async () => {
    // await sleep(30000);

    return callEntryPoint(
      bettingPoolContractAddress,
      `(Left (Right (Right (Pair 5 ${
        Math.floor(Math.random() * 100000) + 1
      }))))`,
      key[2],
      10 * 10 ** 6
    ).should.be.rejected;
  });
  it('Completing a already disbursed bet', async () => {
    const contractInstance = await Tezos.contract.at(
      bettingPoolContractAddress
    );
    const storage = await contractInstance.storage();
    const poolSize = storage.betData.get('5').get('311');
    console.log('pool size', poolSize.senderList.length);
    return callEntryPoint(
      bettingPoolContractAddress,
      `(Left (Left (Left (Pair 268 5))))`,
      key[3],
      0,
      poolSize.senderList.length * 15000 + 500000
    ).should.be.rejected;
    // console.log(operation.operationGroupID);
  });
});
