# owner should be removed from this contract when deploying on mainnet or set to zero

import smartpy as sp

class StakingEscrow(sp.Contract):
    def __init__(self, owner):
        self.init(
            owner = owner, 
            contractAddress = owner)

    @sp.entry_point
    def setContract(self,contract):
        sp.verify(sp.sender == self.data.owner)
        self.data.contractAddress = contract
    
    @sp.entry_point
    def updateBaker(self,baker):
        sp.verify((sp.sender == self.data.owner) | (sp.sender == self.data.owner))
        sp.set_delegate(baker)
    
    @sp.entry_point
    def transferOwnership(self,owner):
        sp.verify(sp.sender == self.data.owner)
        self.data.owner = owner
    
    @sp.entry_point
    def withdraw(self,amount):
        sp.verify((sp.sender == self.data.owner) | (sp.sender == self.data.owner))
        c = sp.contract(sp.TUnit,self.data.contractAddress,entry_point="depositFunds").open_some()
        sp.transfer(sp.unit,sp.mutez(amount),c)
    
    @sp.entry_point
    def depositFunds(self):
        pass

@sp.add_test(name = "Minimal")
def test():
    scenario = sp.test_scenario()
    scenario.h1("Minimal")
    baker = sp.some(sp.key_hash("tz1VxS7ff4YnZRs8b4mMP4WaMVpoQjuo1rjf"))
    deployer = sp.address("tz1PCVSQfsHmrKRgCdLhrN8Yanb5mwEL8rxu")
    c1 = StakingEscrow(deployer)
    scenario += c1
    # now = sp.now
    # scenario += c1.depositFunds()