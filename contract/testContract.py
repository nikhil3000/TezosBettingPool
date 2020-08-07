# owner should be removed from this contract when deploying on mainnet or set to zero

import smartpy as sp

class TestingContract(sp.Contract):
    def __init__(self, owner):
        self.init(
            owner = owner, 
            contractAddress = owner)
            
    @sp.entry_point
    def depositFunds(self):
        pass

@sp.add_test(name = "Minimal")
def test():
    scenario = sp.test_scenario()
    scenario.h1("Minimal")
    baker = sp.some(sp.key_hash("tz1VxS7ff4YnZRs8b4mMP4WaMVpoQjuo1rjf"))
    deployer = sp.address("tz1PCVSQfsHmrKRgCdLhrN8Yanb5mwEL8rxu")
    c1 = TestingContract(deployer)
    scenario += c1