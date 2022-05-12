const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();
const chaiHttp = require('chai-http')
const server = require('../server')

chai.use(chaiHttp)

describe('user workflow test', () => {

  it('registers a user, loges in that user and creates a project', (done) => {

    // create register and login credential
    let user = {
      email: 'testUser@test.com',
      name: 'Test User',
      password: '1234567890'
    }
    let login = {
      email: 'testUser@test.com',
      password: '1234567890'
    }

    let badLogin = {
      email: 'testBadUser@test.com',
      password: '1234567890'
    }

    let userID = '';
    let token = '';
    let projectID = '';

    // create mock project info

    let project = {

      name: "test project one",
      description: "test description ",
      owner: "to be set later",
      isComplete: false,
      allowsManualHoursInput: true,
      timeSchedule: {
        startDate: "2022-05-12T17:59:41.362Z",
        dueDate: "2022-05-12T17:59:41.362Z",
        allocatedHours: 150,
        usedHours: 0
      },
      members: [
      ],
      cards: []
    }


    chai.request(server)
      .post('/api/user/register')
      .send(user)
      .end((err, res) => {
        expect(res.status).to.be.eql(200)
        expect(res.body.error).to.be.eql(null)
        expect(res.body.data).to.be.a('object');


        // login bad user

        chai.request(server)
          .post('/api/user/login')
          .send(badLogin)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('error').eql('email is wrong');


            // login good user

            chai.request(server)
              .post('/api/user/login')
              .send(login)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('error').eql(null);
                res.body.data.should.have.property('_id').be.a('string');
                res.body.data.should.have.property('token').be.a('string');

                // set values for future mutations
                token = res.body.data.token;
                userID = res.body.data._id;

                project.owner = userID
                project.members.push(userID)


                // create first project
                chai.request(server)
                  .post(`/api/projects/${userId}/create`)
                  .set({ "auth-token": token })
                  .send(project)
                  .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.lengthOf(1);
                    res.body[0].should.have.property('owner').eql(userID);
                    res.body[0].should.have.property('isComplete').eql(false);
                    res.body[0].should.have.property('members').be.a('array');
                    res.body[0].members[0].should.be.elq(userID);
                    res.body[0].should.have.property('_id').be.a('string');
                    projectID = res.body[0]._id;


                  })
              })
          })
      })
  })
})
