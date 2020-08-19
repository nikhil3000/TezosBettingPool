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
            adminBalance =sp.mutez(0),
            # amount in mutez
            betSize = sp.map({5:5000000,10:3000000,15:1000000}),
            earnedAmount = 0,
            # yields are multiplied by 100 to support 2 decimal places
            yields = sp.map({5:50,10:75,15:100}),
            betData = sp.map({
            5:sp.map(tkey=sp.TInt,tvalue= sp.TRecord(seed=sp.TNat,senderList=sp.TList(sp.TAddress))),
            10:sp.map(tkey=sp.TInt,tvalue= sp.TRecord(seed=sp.TNat,senderList=sp.TList(sp.TAddress))),
            15:sp.map(tkey=sp.TInt,tvalue= sp.TRecord(seed=sp.TNat,senderList=sp.TList(sp.TAddress)))
            })
            )
            
    @sp.entry_point
    def placeBet(self,params):
        sp.verify_equal(sp.amount,sp.mutez(self.data.betSize[params.betType]),message="incorrect amount sent to the entry point")
        sp.if self.data.betData[params.betType].contains(self.data.currentCycle):
            self.data.betData[params.betType][self.data.currentCycle].senderList.push(sp.sender)
            self.data.betData[params.betType][self.data.currentCycle].seed = (self.data.betData[params.betType][self.data.currentCycle].seed + params.seed + abs(sp.now - sp.timestamp(0)))%100000     
            # modulo 100000 to avoid any int overflows
        sp.else:
            self.data.betData[params.betType][self.data.currentCycle] = sp.record(seed=params.seed,senderList=[sp.sender])
    
    @sp.entry_point
    def completeBet(self,params):
        sp.verify(params.betId + params.betType < self.data.currentCycle, message="Bet not yet mature")
        sp.verify(self.data.betSize.contains(params.betType),message="Invalid bet type")
        #  calculate winner
        betPool = self.data.betData[params.betType][params.betId]
        winnerIndex = (betPool.seed + abs(sp.now-sp.timestamp(0))) % sp.len(betPool.senderList) 
        # calculating winner amount 
        self.data.earnedAmount = self.data.betSize[params.betType] * sp.len(betPool.senderList) * self.data.yields[params.betType] / 10000
        #disburse Amounts
        i = sp.local('i',0)
        
        amount = self.data.earnedAmount * 10 / 100 
        self.data.adminBalance += sp.mutez(amount)
        sp.for x in betPool.senderList:
            sp.if i.value==winnerIndex:
                amount = self.data.earnedAmount * 90 / 100 + self.data.betSize[params.betType]
                sp.send(x,sp.mutez(amount))
            sp.else:
                sp.send(x,sp.mutez(self.data.betSize[params.betType]))
            i.value = i.value+1
            
    # param should be removed and cycle should increment by 1 at a time.   
    @sp.entry_point
    def incrementCycle(self,param):
        sp.verify(sp.sender==self.data.admin)
        self.data.currentCycle += param
        
    @sp.entry_point
    def updateBaker(self,baker):
        sp.verify(sp.sender == self.data.admin)
        sp.set_delegate(baker)
        
    @sp.entry_point
    def depositFunds(self):
        sp.if sp.sender==self.data.admin:
            self.data.adminBalance += sp.amount
            
    @sp.entry_point
    def withdrawAdminFunds(self,amount):
        sp.verify(sp.sender == self.data.admin)
        sp.verify(sp.mutez(amount) <= self.data.adminBalance)
        sp.send(self.data.admin,sp.mutez(amount))
        self.data.adminBalance -= sp.mutez(amount)
  

@sp.add_test(name = "Minimal")
def test():
    scenario = sp.test_scenario()
    scenario.h1("Minimal")
    deployer = sp.address("tz1PCVSQfsHmrKRgCdLhrN8Yanb5mwEL8rxu")
    user1 = sp.test_account("Nikhil")
    user2 = sp.test_account("Alice")
    c1 = BettingPool(deployer)
    scenario += c1
    for i in range(7):
        user = sp.test_account(str(i))
        scenario.register(c1.placeBet(betType=5,seed=i).run(sender=user,amount=sp.tez(5),now=1000+i))
    scenario += c1.incrementCycle(6).run(sender=deployer)
    scenario += c1.completeBet(betType=5,betId=311)
 