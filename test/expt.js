const {
  sleep,
  deployContract,
  callEntryPoint,
  tezosNode,
} = require('./testUtil');
const fs = require('fs');
const addresses = require('../address.json');

let bettingPoolContractAddress = 'KT1B4tWX4noL33VKukgBCzzNTnxJtfkiao3e';
const { Tezos } = require('@taquito/taquito');
Tezos.setProvider({ rpc: tezosNode });

async function init() {
  // Tezos.contract
  //   .at(bettingPoolContractAddress)
  //   .then((myContract) => {
  //     // console.log(myContract);
  //     return myContract.storage();
  //   })
  //   .then((storage) => {
  //     // console.log(storage);
  //     const list = storage.betData.get('5').get('311');
  //     console.log(list);
  //   });
  console.log(addresses);
  let { oracleAddress, bettingPoolContractAddress } = addresses;
  console.log(oracleAddress);
}

// init();
