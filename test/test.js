const assert = require('assert');
const conseiljs = require('conseiljs');
const config = require('../config.json');
var fs = require('fs');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

require.extensions['.tz'] = function (module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

describe('my test suite', function () {
  // deploy all the contracts here
  this.timeout(0);

  let escrowContractAddress = 'KT1TtZkpjQb5RSjMdLHB1AanMPgYRZDGhJ4P';
  let testContractAddress = 'KT1XhSUhXehz4PTUAXjo7aP2Kbzi7xGPZbrA';
  const tezosNode = config.deploy_config.node;
  const amount = 1;
  const fee = config.deploy_config.fee;
  const derivation_path = config.deploy_config.derivation_path;
  const delegate_address =
    config.deploy_config.delegate_address.length != 0
      ? config.deploy_config.delegate_address
      : undefined;
  const storage_limit = config.deploy_config.storage_limit;
  const gas_limit = config.deploy_config.gas_limit;
  const key1 = require('../keystore/key1');
  const key2 = require('../keystore/key2');

  // describe('Deploying ', function () {
  //   this.timeout(0);

  //   const escrowContract = require('../contract_build/stakingEscrow_compiled.tz');
  //   const escrowStorage = require('../contract_build/stakingEscrow_storage_init.tz');
  //   const testContract = require('../contract_build/testContract_compiled.tz');
  //   const testStorage = require('../contract_build/testContract_storage_init.tz');
  //   it(' EscrowContract : Should deploy sucessfully', async function () {
  //     const result = await conseiljs.TezosNodeWriter.sendContractOriginationOperation(
  //       tezosNode,
  //       key1,
  //       amount,
  //       delegate_address,
  //       fee,
  //       derivation_path,
  //       storage_limit,
  //       gas_limit,
  //       escrowContract,
  //       escrowStorage,
  //       conseiljs.TezosParameterFormat.Michelson
  //     );
  //     console.log(
  //       `Injected operation ! \n Contract Deployed with group ID : ${result.operationGroupID}`
  //     );
  //     console.log(
  //       `Contract Address : ${result.results.contents[0].metadata.operation_result.originated_contracts[0]} \n`
  //     );
  //     escrowContractAddress =
  //       result.results.contents[0].metadata.operation_result
  //         .originated_contracts[0];
  //     assert(
  //       result.results.contents[0].metadata.operation_result.originated_contracts[0]
  //         .toString()
  //         .startsWith('KT')
  //     );
  //   });

  //   it(' TestContract : Should deploy sucessfully', async function () {
  //     const result = await conseiljs.TezosNodeWriter.sendContractOriginationOperation(
  //       tezosNode,
  //       key2,
  //       amount,
  //       delegate_address,
  //       fee,
  //       derivation_path,
  //       storage_limit,
  //       gas_limit,
  //       testContract,
  //       testStorage,
  //       conseiljs.TezosParameterFormat.Michelson
  //     );
  //     console.log(
  //       `Injected operation ! \n Contract Deployed with group ID : ${result.operationGroupID}`
  //     );
  //     console.log(
  //       `Contract Address : ${result.results.contents[0].metadata.operation_result.originated_contracts[0]} \n`
  //     );
  //     testContractAddress =
  //       result.results.contents[0].metadata.operation_result
  //         .originated_contracts[0];
  //     assert(
  //       result.results.contents[0].metadata.operation_result.originated_contracts[0]
  //         .toString()
  //         .startsWith('KT')
  //     );
  //   });
  // });
  describe('Contract interaction', async () => {
    //   // this.timeout(0);
    // it('Setting contract Address', async () => {
    //   console.log('sleeping for 30 seconds');
    //   await sleep(30000);
    //   const result = await conseiljs.TezosNodeWriter.sendContractInvocationOperation(
    //     tezosNode,
    //     key1,
    //     escrowContractAddress,
    //     0,
    //     fee,
    //     derivation_path,
    //     storage_limit,
    //     gas_limit,
    //     '',
    //     `(Left (Right "${testContractAddress}"))`,
    //     conseiljs.TezosParameterFormat.Michelson
    //   );

    //   console.log(
    //     `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
    //   );
    // });
    // it('deposit funds', async () => {
    //   console.log('sleeping for 30 seconds');
    //   // await sleep(30000);
    //   const result = await conseiljs.TezosNodeWriter.sendContractInvocationOperation(
    //     tezosNode,
    //     key2,
    //     escrowContractAddress,
    //     10000000,
    //     fee,
    //     derivation_path,
    //     storage_limit,
    //     gas_limit,
    //     '',
    //     `(Left (Left Unit))`,
    //     conseiljs.TezosParameterFormat.Michelson
    //   );

    //   console.log(
    //     `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
    //   );
    // });
    // it('set delegation', async () => {
    //   console.log('sleeping for 30 seconds');
    //   await sleep(30000);

    //   const result = await conseiljs.TezosNodeWriter.sendContractInvocationOperation(
    //     tezosNode,
    //     key1,
    //     escrowContractAddress,
    //     0,
    //     fee,
    //     derivation_path,
    //     storage_limit,
    //     gas_limit,
    //     '',
    //     `(Right (Right (Left (Some "tz1NRTQeqcuwybgrZfJavBY3of83u8uLpFBj"))))`,
    //     conseiljs.TezosParameterFormat.Michelson
    //   );

    //   console.log(
    //     `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
    //   );
    // });
    it('withdraw', async () => {
      // console.log('sleeping for 30 seconds');
      // await sleep(30000);

      const result = await conseiljs.TezosNodeWriter.sendContractInvocationOperation(
        tezosNode,
        key1,
        escrowContractAddress,
        0,
        fee,
        derivation_path,
        storage_limit,
        gas_limit,
        '',
        `(Right (Right (Right 5000000)))`,
        conseiljs.TezosParameterFormat.Michelson
      );

      console.log(
        `Injected operation ! \n Invocation Group ID : ${result.operationGroupID}`
      );
    });
  });
});
