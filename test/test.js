const assert = require('assert');
const conseiljs = require('conseiljs');
const config = require('../config.json');
const fs = require('fs');
const chai = require('chai').use(require('chai-as-promised'));
// const axios = require('axios');
const { Tezos } = require('@taquito/taquito');
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
let bettingPoolContractAddress = 'KT1GtFUxFuvb6yUoNuxqeykhAiKhEFTYzRSc';
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
    assert(
      result.results.contents[0].metadata.operation_result.originated_contracts[0]
        .toString()
        .startsWith('KT')
    );
  });
  it(' Adding Baker', async function () {
    await sleep(30000);
    const result = await callEntryPoint(
      bettingPoolContractAddress,
      `(Right (Right (Left (Some "tz1NRTQeqcuwybgrZfJavBY3of83u8uLpFBj"))))`
    );
    console.log(
      `Injected operation ! \n Contract Deployed with group ID : ${result.operationGroupID}`
    );
    console.log(
      `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
    );
  });
});

describe('functions', async function () {
  this.timeout(0);
  it('Deposit Funds', async () => {
    const result = await callEntryPoint(
      bettingPoolContractAddress,
      `(Left (Right (Left Unit)))`,
      key[0],
      10 ** 7
    );
    console.log(
      `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
    );
  });
  it('Creating Bets', async () => {
    let promiseList = [];

    key.forEach(async (_key) => {
      if (_key != key[0]) {
        let temp = callEntryPoint(
          bettingPoolContractAddress,
          `(Right (Left (Pair 5 ${Math.floor(Math.random() * 100000) + 1})))`,
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
  it('Update cycle Number', async () => {
    await sleep(30000);
    const data = await callEntryPoint(
      bettingPoolContractAddress,
      ` (Left (Right (Right 6)))`,
      key[0]
    );
    console.log(data.operationGroupID);
  });
  it('Complete Bet', async () => {
    const contractInstance = await Tezos.contract.at(
      bettingPoolContractAddress
    );
    const storage = await contractInstance.storage();
    const poolSize = storage.betData.get('5').get('311').senderList.length;
    console.log('pool size', poolSize);
    const operation = await callEntryPoint(
      bettingPoolContractAddress,
      `(Left (Left (Pair 311 5)))`,
      key[3],
      0,
      poolSize * 15000 + 500000
    );
    console.log(operation.operationGroupID);
  });
  it('Wrong BetType', async () => {
    // await sleep(30000);
    return callEntryPoint(
      bettingPoolContractAddress,
      `(Right (Left (Pair 6 ${Math.floor(Math.random() * 100000) + 1})))`,
      key[1],
      5 * 10 ** 6
    ).should.be.rejected;
  });
  it('Wrong BetAmount', async () => {
    // await sleep(30000);

    return callEntryPoint(
      bettingPoolContractAddress,
      `(Right (Left (Pair 5 ${Math.floor(Math.random() * 100000) + 1})))`,
      key[2],
      10 * 10 ** 6
    ).should.be.rejected;
  });
  it('Completing a already disbursed bet', async () => {
    const contractInstance = await Tezos.contract.at(
      bettingPoolContractAddress
    );
    const storage = await contractInstance.storage();
    const poolSize = storage.betData.get('5').get('311').senderList.length;
    console.log('pool size', poolSize);
    return callEntryPoint(
      bettingPoolContractAddress,
      `(Left (Left (Pair 311 5)))`,
      key[3],
      0,
      poolSize * 15000 + 500000
    ).should.be.rejected;
    // console.log(operation.operationGroupID);
  });
});
