import smartpy as sp

class TestingContract(sp.Contract):
    @sp.entry_point
    def depositFunds(self):
        pass


class BettingPool(sp.Contract):
    def __init__(self, admin):
        self.init(
            admin = admin, 
            currentCycle =311,
            betSize = sp.map({5:5,10:3,15:1}),
            
            # yields are multiplied by 100 to support 2 decimal places
            yields = sp.map({5:50,10:75,15:100}),
            
            betData = sp.map({
            5:sp.map(tkey=sp.TInt,tvalue= sp.TRecord(seed=sp.TBytes,senderList=sp.TList(sp.TAddress))),
            10:sp.map(tkey=sp.TInt,tvalue= sp.TRecord(seed=sp.TBytes,senderList=sp.TList(sp.TAddress))),
            15:sp.map(tkey=sp.TInt,tvalue= sp.TRecord(seed=sp.TBytes,senderList=sp.TList(sp.TAddress)))
            })
            )
            
    @sp.entry_point
    def placeBet(self,params):
        sp.verify_equal(sp.amount,sp.tez(self.data.betSize[params.betType]),message="incorrect amount sent to the entry point")
        sp.if self.data.betData[params.betType].contains(self.data.currentCycle):
            self.data.betData[params.betType][self.data.currentCycle].senderList.push(sp.sender)
            self.data.betData[params.betType][self.data.currentCycle].seed = sp.sha256(self.data.betData[params.betType][self.data.currentCycle].seed + sp.sha256(params.seed))
        sp.else:
            self.data.betData[params.betType][self.data.currentCycle] = sp.record(seed=params.seed,senderList=[sp.sender])
       
    # param should be removed and cycle should increment by 1 at a time.   
    @sp.entry_point
    def incrementCycle(self,param):
        # sp.verify(sp.sender==self.data.admin)
        self.data.currentCycle += param
  

@sp.add_test(name = "Minimal")
def test():
    scenario = sp.test_scenario()
    scenario.h1("Minimal")
    deployer = sp.address("tz1PCVSQfsHmrKRgCdLhrN8Yanb5mwEL8rxu")
    user1 = sp.test_account("Nikhil")
    user2 = sp.test_account("Alice")
    c1 = BettingPool(deployer)
    scenario += c1
    scenario += c1.placeBet(betType=5, seed=sp.bytes('0x001234')).run(sender=user1, amount=sp.tez(5))
    scenario += c1.placeBet(betType=5, seed=sp.bytes('0x001235')).run(sender=user2, amount=sp.tez(5))
    for i in range(7):
        user = sp.test_account(str(i))
        scenario += c1.placeBet(betType=5,seed=sp.bytes("0xAA1"+str(i))).run(sender=user,amount=sp.tez(5))
 