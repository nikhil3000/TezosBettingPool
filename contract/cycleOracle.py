import smartpy as sp

class CycleOracle(sp.Contract):
    def __init__(self,admin):
        self.init(
            owner=admin,
            keysset = sp.set([admin]),
            cycleNumber = 268
            )
    @sp.entry_point
    def addDataContributor(self,params):
        sp.if sp.sender == self.data.owner:
            self.data.keysset.add(params.contributor)
            
    @sp.entry_point
    def feedData(self,params):
        sp.if (self.data.keysset.contains(sp.sender)):
            sp.if (self.data.cycleNumber != params.cycleNumber):
                self.data.cycleNumber = params.cycleNumber
                
    @sp.entry_point
    def getDataFromOro(self,params):
        sp.set_type(params.entryAddress,sp.TAddress)
        errcd = sp.record(uuid=params.uuid,cycleNumber=0)
        contract = sp.contract(sp.TRecord(uuid = sp.TNat, cycleNumber = sp.TNat),params.entryAddress).open_some()
        
        sp.if sp.amount == sp.mutez(5000):
            sp.transfer(sp.record(uuid=params.uuid,cycleNumber=self.data.cycleNumber),sp.mutez(0),contract)
        sp.else:
            sp.transfer(errcd,sp.amount,contract)