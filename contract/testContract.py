# owner should be removed from this contract when deploying on mainnet or set to zero

import smartpy as sp

class TestingContract(sp.Contract):
    @sp.entry_point
    def depositFunds(self):
        pass
    @sp.entry_point
    def entry2Deposit(self):
        pass
        
@sp.add_test(name = "Minimal")
def test():
    scenario = sp.test_scenario()
    scenario.h1("Minimal")
    deployer = sp.address("tz1PCVSQfsHmrKRgCdLhrN8Yanb5mwEL8rxu")
    c1 = StakingEscrow(deployer)
    c2 = TestingContract()
    scenario += c1
    scenario += c2
    scenario += c1.setContract(c2.address).run(sender=deployer)
    scenario += c1.depositFunds().run(amount = sp.tez(10))
    scenario += c1.withdraw(5000000).run(sender=deployer)