const conseiljs = require('conseiljs');
const config = require('../config.json');
const key1 = require('../keystore/key1');

const tezosNode = config.deploy_config.node;
const fee = config.deploy_config.fee;
const derivation_path = config.deploy_config.derivation_path;
const delegate_address =
  config.deploy_config.delegate_address.length != 0
    ? config.deploy_config.delegate_address
    : undefined;
const storage_limit = config.deploy_config.storage_limit;
const gas_limit = config.deploy_config.gas_limit;

const callEntryPoint = (
  contractAddress,
  parameter,
  key = key1,
  amount = 0,
  gasLimit = gas_limit
) => {
  console.log(key.publicKeyHash);
  //   console.log(amount);
  return conseiljs.TezosNodeWriter.sendContractInvocationOperation(
    tezosNode,
    key,
    contractAddress,
    amount,
    fee,
    derivation_path,
    storage_limit,
    gasLimit,
    '',
    parameter,
    conseiljs.TezosParameterFormat.Michelson
  );
};

const deployContract = async (contract, storage, key = key1, amount = 0) => {
  return conseiljs.TezosNodeWriter.sendContractOriginationOperation(
    tezosNode,
    key,
    amount,
    delegate_address,
    fee,
    derivation_path,
    storage_limit,
    gas_limit,
    contract,
    storage,
    conseiljs.TezosParameterFormat.Michelson
  );
};

const sleep = (ms) => {
  // return new Promise((resolve) => setTimeout(resolve, ms));
  const P = ['\\', '|', '/', '-'];
  let x = 0;
  console.log('sleeping...');
  const loader = setInterval(() => {
    process.stdout.write(`\r${P[x++]}`);
    x %= P.length;
  }, ms / 200);

  return new Promise((resolve) => {
    setTimeout(() => {
      clearInterval(loader);
      process.stdout.write(`\r`);
      console.log('Continuing ..');
      resolve();
    }, ms);
  });
};

module.exports = {
  sleep,
  deployContract,
  callEntryPoint,
  tezosNode,
};
