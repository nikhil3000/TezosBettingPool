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
            oracleAddress = sp.address("KT1NN7B3Wc5vb93wL87Fsu1HJepLkCU5JRHM"),
            # amount in mutez
            betSize = sp.map({5:5000000,10:3000000,15:1000000}),
            earnedAmount = 0,
            tempData = sp.map(tkey=sp.TNat,tvalue=sp.TRecord(seed=sp.TNat,betType=sp.TNat,sender=sp.TAddress)),
            # yields are multiplied by 100 to support 2 decimal places
            yields = sp.map({5:50,10:75,15:100}),
            betData = sp.map({
            5:sp.map(tkey=sp.TNat,tvalue= sp.TRecord(seed=sp.TNat,senderList=sp.TList(sp.TAddress))),
            10:sp.map(tkey=sp.TNat,tvalue= sp.TRecord(seed=sp.TNat,senderList=sp.TList(sp.TAddress))),
            15:sp.map(tkey=sp.TNat,tvalue= sp.TRecord(seed=sp.TNat,senderList=sp.TList(sp.TAddress)))
            })
            )
            
    @sp.entry_point
    def placeBet(self,params):
        sp.verify(self.data.betData.contains(params.betType), message="incorrect bet type")
        sp.verify_equal(sp.amount,sp.mutez(self.data.betSize[params.betType]),message="incorrect amount sent to the entry point")
        # multiplied seed by 10000 to retain last 6 digits of timestamp
        uuid = abs(sp.now - sp.timestamp(0)) + params.seed * 1000000
        self.data.tempData[uuid] = sp.record(seed=params.seed,sender=sp.sender,betType=params.betType)
        contract = sp.contract(sp.TNat,self.data.oracleAddress,entry_point="getDataFromOro").open_some()
        sp.transfer(uuid,sp.mutez(5000),contract)
        
        # sp.if self.data.betData[params.betType].contains(self.data.currentCycle):
        #     self.data.betData[params.betType][self.data.currentCycle].senderList.push(sp.sender)
        #     self.data.betData[params.betType][self.data.currentCycle].seed = (self.data.betData[params.betType][self.data.currentCycle].seed + params.seed + abs(sp.now - sp.timestamp(0)))%100000     
        #     # modulo 100000 to avoid any int overflows
        # sp.else:
        #     self.data.betData[params.betType][self.data.currentCycle] = sp.record(seed=params.seed,senderList=[sp.sender])
    
    
    @sp.entry_point
    def placeBetFromOro(self,params):
        sp.verify(sp.sender==self.data.oracleAddress, message="can be invoked by oro only")
        sp.verify(params.cycleNumber!=0,message="Oro returned error")
        self.data.currentCycle = params.cycleNumber
        tempData = self.data.tempData[params.uuid]
        sp.if self.data.betData[tempData.betType].contains(params.cycleNumber):
            self.data.betData[tempData.betType][params.cycleNumber].senderList.push(tempData.sender)
            self.data.betData[tempData.betType][params.cycleNumber].seed = (self.data.betData[tempData.betType][params.cycleNumber].seed + tempData.seed + abs(sp.now - sp.timestamp(0)))%100000     
            # modulo 100000 to avoid any int overflows
        sp.else:
            self.data.betData[tempData.betType][params.cycleNumber] = sp.record(seed=tempData.seed,senderList=[tempData.sender])
        del self.data.tempData[params.uuid]
        
    
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
        del self.data.betData[params.betType][params.betId]
            
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
    def updateOracle(self,oracle):
        sp.verify(sp.sender == self.data.admin)
        self.data.oracleAddress = oracle 
        
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
    def getDataFromOro(self,uuid):
        errcd = sp.record(uuid=uuid,cycleNumber=0)
        contract = sp.contract(sp.TRecord(uuid = sp.TNat, cycleNumber = sp.TNat),sp.sender,entry_point = "placeBetFromOro").open_some()
        
        sp.if sp.amount == sp.mutez(5000):
            sp.transfer(sp.record(uuid=uuid,cycleNumber=self.data.cycleNumber),sp.mutez(0),contract)
        sp.else:
            sp.transfer(errcd,sp.amount,contract)

@sp.add_test(name = "Minimal")
def test():
    scenario = sp.test_scenario()
    scenario.h1("Minimal")
    deployer = sp.address("tz1PCVSQfsHmrKRgCdLhrN8Yanb5mwEL8rxu")
    deployer2 = sp.test_account("hello")
    user1 = sp.test_account("Nikhil")
    user2 = sp.test_account("Alice")
    c1 = BettingPool(deployer)
    c2 = CycleOracle(sp.address("tz1PCVSQfsHmrKRgCdLhrN8Yanb5mwEL8rxu"))
    scenario += c1
    scenario += c2
    scenario.register(c1.updateBaker(sp.some(sp.key_hash('tz1NRTQeqcuwybgrZfJavBY3of83u8uLpFBj'))).run(sender=deployer))
    scenario += c1.updateOracle(c2.address).run(sender=deployer)
    for i in range(7):
        user = sp.test_account(str(i))
        scenario += c1.placeBet(betType=5,seed=i).run(sender=user,amount=sp.tez(5),now=1000+i)
    scenario += c1.incrementCycle(6).run(sender=deployer)
    scenario += c1.completeBet(betType=5,betId=268).run(now=11000)