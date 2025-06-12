const isAuth = require("../middleware/is-auth"); 
const expect = require("chai").expect;

describe("isAuth middleware:", () =>{
    it("should redirect to /login if not logged in", () =>{
        const req = {
            session: {
                isLoggedIn: false
            }
        }; 
        let redirectedPath = ""; 
        const res = {
            redirect: (path) =>{
                redirectedPath = path;  
            }
        }; 
        isAuth(req, res, () => {}); 
        expect(redirectedPath).to.equal("/login"); 
    }); 

    it("should call next() if logged in", () =>{
        const req = {
            session: {
                isLoggedIn: true
            }
        }; 

        let nextCalled = false; 
        const next = () =>{
            nextCalled = true; 
        };
        isAuth(req, {}, next); 
        expect(nextCalled).to.be.true; 
    }); 
});