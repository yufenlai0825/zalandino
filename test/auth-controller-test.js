const expect = require("chai").expect;
const sinon = require("sinon");
const User = require("../models/user"); 
const authController = require("../controllers/auth"); 
const mongoose = require("mongoose"); 
const expressValidator = require("../middleware/validation"); 
const env = require("dotenv"); 
env.config(); 

describe("Auth Controller: ", () => {

    // dummy user
    before(async () => {
        await  mongoose.connect(process.env.TESTMONGODB_URI); 

        const user = new User({
            email: "test@test.com",
            password: "testpassword",
            cart: { items: []},
            _id: "5c0f66b979af55031b34728a"
        }); 
        await user.save(); 
    }); 

    it("should call next(err) to global error handling if can't access db", async () => {

        // simlulate pass the validation
        const mockValidationResult = {
            isEmpty: () => true,
            array: () => []
        }; 
        // sinon.stub(expressValidator, "validationResult").returns(mockValidationResult);
        const validationStub = sinon.stub(expressValidator, "validationResult");
        validationStub.returns(mockValidationResult);
        
        sinon.stub(User, "findOne").rejects(); 
        const req = {
            body: {
                email: "test@test.com",
                password: "testpassword"
            }
        }; 

        const next = sinon.spy(); 
        await authController.postLogin(req, {}, next); 
        console.log("Next called?", next.called); 
        console.log("Arguments passed to next:", next.firstCall?.args);

        expect(next.calledOnce).to.be.true; 
        expect(next.firstCall.args[0]).to.be.an("error"); 

        User.findOne.restore(); 
        // expressValidator.validationResult.restore(); 
        validationStub.restore();
    }); 

    it("should destroy session and redirect to main page if user is logged out", () => {

        const destroyStub = sinon.stub().callsFake(cb => cb()); 

        const req = {
            session: {
                destroy: destroyStub
            }
        }; 

        const res = {
            redirect: sinon.spy()
        }; 

        authController.postLogout(req, res, () => {});
        expect(destroyStub.calledOnce).to.be.true; 
        expect(res.redirect.calledOnceWith("/")).to.be.true; 

    }); 

    after(async () => {
        await User.deleteMany(); 
        return mongoose.disconnect(); 
    }); 
}); 