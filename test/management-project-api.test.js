const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();
const chaiHttp = require('chai-http')
const server = require('../server')

chai.use(chaiHttp)

describe('user workflow test', () => {

  it('registers a user, loges in that user, creates a project, a card on that project and changes th e stage on that card from backlog to active', (done) => {

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
    let firstCardID = '';
    let firstTaskID = '';

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

    let card = {
      cardName: "first ever card in tests"
    }

    // used to update the cards stage 
    const active = {
      stage: 'active'
    }

    const task = {
      taskName: "first task",
      taskDescription: "some basic thing to do"
    }


    chai.request(server)
      .post('/api/user/register')
      .send(user)
      .end((err, res) => {
        expect(res.status).to.be.eql(200)
        expect(res.body.error).to.be.eql(null)
        expect(res.body.data).to.be.a('string');


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
                res.body.data.should.have.property('user_id').be.a('string');
                res.body.data.should.have.property('token').be.a('string');

                // set values for future mutations
                token = res.body.data.token;
                userID = res.body.data.user_id;

                project.owner = userID
                project.members.push(userID)

                // create first project

                chai.request(server)
                  .post(`/api/projects/${userID}/create`)
                  .set({ "auth-token": token })
                  .send(project)
                  .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('array');
                    res.body.should.have.lengthOf(1);
                    res.body[0].should.have.property('owner').eql(userID);
                    res.body[0].should.have.property('isComplete').eql(false);
                    res.body[0].should.have.property('members').be.a('array');
                    res.body[0].members[0].should.be.eql(userID);
                    res.body[0].should.have.property('_id').be.a('string');
                    projectID = res.body[0]._id;


                    // create the first card

                    chai.request(server)
                      .post(`/api/projects/${projectID}/create-card`)
                      .set({ "auth-token": token })
                      .send(card)
                      .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.be.a('array')
                        res.body.should.have.lengthOf(1)
                        res.body[0].should.have.property('stage').eql('backlog')
                        res.body[0].should.have.property('isComplete').eql(false)
                        res.body[0].should.have.property('index').eql(0)

                        firstCardID = res.body[0]._id


                        // check is card is pushed on project cards array

                        chai.request(server)
                          .get(`/api/projects/${projectID}`)
                          .set({ "auth-token": token })
                          .end((err, res) => {
                            res.should.have.status(200)
                            res.body.should.be.a('object')
                            res.body.cards[0].should.have.property("_id").eql(firstCardID)


                            // update cards stage

                            chai.request(server)
                              .put(`/api/projects/${projectID}/cards/${firstCardID}/update`)
                              .set({ "auth-token": token })
                              .send(active)
                              .end((err, res) => {
                                res.should.have.status(201)
                                res.body.should.have.property('stage').eql('active')



                                done()

                              })
                          })
                      })

                  })
              })
          })
      })

  })

})
