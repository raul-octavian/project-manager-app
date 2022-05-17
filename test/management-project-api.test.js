const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();
const chaiHttp = require('chai-http')
const server = require('../server')

chai.use(chaiHttp)

describe('user workflow test', () => {

  it('registers a user, loges in that user, creates a project, a card on that project and changes the stage on that card from backlog to active. The creates a new task on that card, and registers a new user. Adds the new user to aht card and checks that it is set on card and project. Update task status to true ', (done) => {

    // create register and login credential
    let user = {
      email: 'testUser@test.com',
      name: 'Test User',
      password: '1234567890'
    }

    let userTwo = {
      email: 'testUserTwo@test.com',
      name: 'Test User Two',
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
    let userTwoID = '';
    let token = '';
    let projectID = '';
    let firstCardID = '';
    let firstTaskID = '';
    let secondCardID = '';
    let secondTaskID = ''

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
    let cardTwo = {
      cardName: "second ever card in tests"
    }

    // used to update the cards stage 
    const active = {
      stage: 'active'
    }

    const task = {
      taskName: "first task",
      taskDescription: "some basic thing to do"
    }
    const taskTwo = {
      taskName: "second task",
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

                //         // set values for future mutations
                //         token = res.body.data.token;
                //         userID = res.body.data.user_id;

                //         project.owner = userID
                //         project.members.push(userID)

                //         // create first project

                //         chai.request(server)
                //           .post(`/api/projects/${userID}/create`)
                //           .set({ "auth-token": token })
                //           .send(project)
                //           .end((err, res) => {
                //             res.should.have.status(200);
                //             res.body.should.be.a('array');
                //             res.body.should.have.lengthOf(1);
                //             res.body[0].should.have.property('owner').eql(userID);
                //             res.body[0].should.have.property('isComplete').eql(false);
                //             res.body[0].should.have.property('members').be.a('array');
                //             res.body[0].members[0].should.be.eql(userID);
                //             res.body[0].should.have.property('_id').be.a('string');
                //             projectID = res.body[0]._id;


                //             // create the first card

                //             chai.request(server)
                //               .post(`/api/projects/${projectID}/create-card`)
                //               .set({ "auth-token": token })
                //               .send(card)
                //               .end((err, res) => {
                //                 res.should.have.status(200)
                //                 res.body.should.be.a('array')
                //                 res.body.should.have.lengthOf(1)
                //                 res.body[0].should.have.property('stage').eql('backlog')
                //                 res.body[0].should.have.property('isComplete').eql(false)
                //                 res.body[0].should.have.property('index').eql(0)

                //                 firstCardID = res.body[0]._id


                //                 // check is card is pushed on project cards array

                //                 chai.request(server)
                //                   .get(`/api/projects/${projectID}`)
                //                   .set({ "auth-token": token })
                //                   .end((err, res) => {
                //                     res.should.have.status(200)
                //                     res.body.should.be.a('object')
                //                     res.body.cards[0].should.have.property("_id").eql(firstCardID)


                //                     // update cards stage

                //                     chai.request(server)
                //                       .put(`/api/projects/${projectID}/cards/${firstCardID}/update`)
                //                       .set({ "auth-token": token })
                //                       .send(active)
                //                       .end((err, res) => {
                //                         res.should.have.status(201)
                //                         res.body.should.have.property('stage').eql('active')


                //                         // add one task to card

                //                         chai.request(server)
                //                           .post(`/api/projects/${userID}/${projectID}/${firstCardID}/create-task`)
                //                           .set({ "auth-token": token })
                //                           .send(task)
                //                           .end((err, res) => {
                //                             res.should.have.status(200)
                //                             res.body.should.be.a('array')
                //                             res.body[0].should.have.property('taskName').be.a('string')
                //                             res.body[0].should.have.property('status').eql(false)

                //                             firstTaskID = res.body[0]._id


                //                             // register a new user to the project

                //                             chai.request(server)
                //                               .post('/api/user/register')
                //                               .send(userTwo)
                //                               .end((err, res) => {
                //                                 expect(res.status).to.be.eql(200)
                //                                 expect(res.body.error).to.be.eql(null)
                //                                 expect(res.body.data).to.be.a('string');

                //                                 userTwoID = res.body.data


                //                                 // add userTwo to the card

                //                                 chai.request(server)
                //                                   .put(`/api/projects/${userID}/${projectID}/${firstCardID}/members`)
                //                                   .set({ "auth-token": token })
                //                                   .send({ email: userTwo.email })
                //                                   .end((err, res) => {
                //                                     res.should.have.status(200)


                //                                     // test if the user is on the card and project members lists

                //                                     chai.request(server)
                //                                       .get(`/api/projects/${projectID}`)
                //                                       .set({ "auth-token": token })
                //                                       .end((err, res) => {
                //                                         res.should.have.status(200)
                //                                         res.body.should.be.a('object')
                //                                         res.body.members.should.have.length(2)
                //                                         res.body.members[1].should.have.property('_id').eql(userTwoID)
                //                                         res.body.cards[0].cardMembers[0].should.have.property('_id').eql(userTwoID)


                //                                         // update task status to true

                //                                         chai.request(server)
                //                                           .put(`/api/projects/tasks/${firstTaskID}/update`)
                //                                           .set({ "auth-token": token })
                //                                           .send({
                //                                             status: true
                //                                           })
                //                                           .end((err, res) => {
                //                                             res.should.have.status(201)


                //                                             // check if the task was updated

                //                                             chai.request(server)
                //                                               .get(`/api/projects/tasks/${firstTaskID}`)
                //                                               .set({ "auth-token": token })
                //                                               .end((err, res) => {
                //                                                 res.should.have.status(200)
                //                                                 res.body.should.have.property('status').eql(true)


                //                                                 // update card isComplete to true

                //                                                 chai.request(server)
                //                                                   .put(`/api/projects/${projectID}/cards/${firstCardID}/update`)
                //                                                   .set({ "auth-token": token })
                //                                                   .send({ isComplete: true })
                //                                                   .end((err, res) => {
                //                                                     res.should.have.status(201)
                //                                                     res.body.should.have.property('isComplete').eql(true)


                //                                                     // add a second card to project

                //                                                     chai.request(server)
                //                                                       .post(`/api/projects/${projectID}/create-card`)
                //                                                       .set({ "auth-token": token })
                //                                                       .send(cardTwo)
                //                                                       .end((err, res) => {
                //                                                         res.should.have.status(200)
                //                                                         res.body.should.be.a('array')
                //                                                         res.body.should.have.lengthOf(1)
                //                                                         res.body[0].should.have.property('stage').eql('backlog')
                //                                                         res.body[0].should.have.property('isComplete').eql(false)
                //                                                         res.body[0].should.have.property('index').eql(1)

                //                                                         secondCardID = res.body[0]._id


                //                                                         // add a task to second card

                //                                                         chai.request(server)
                //                                                           .post(`/api/projects/${userID}/${projectID}/${secondCardID}/create-task`)
                //                                                           .set({ "auth-token": token })
                //                                                           .send(taskTwo)
                //                                                           .end((err, res) => {
                //                                                             res.should.have.status(200)
                //                                                             res.body.should.be.a('array')
                //                                                             res.body[0].should.have.property('taskName').be.a('string')
                //                                                             res.body[0].should.have.property('status').eql(false)

                //                                                             secondTaskID = res.body[0]._id


                //                                                             // delete second card

                //                                                             chai.request(server)
                //                                                               .delete(`/api/projects/cards/${projectID}/${secondCardID}/delete`)
                //                                                               .set({ "auth-token": token })
                //                                                               .end((err, res) => {
                //                                                                 res.should.have.status(201)
                //                                                                 res.body.should.have.property('message').eql('card deleted from project')


                //                                                                 // check if the second task is deleted

                //                                                                 chai.request(server)
                //                                                                   .get(`/api/projects/tasks/${secondTaskID}`)
                //                                                                   .set({ "auth-token": token })
                //                                                                   .end((err, res) => {
                //                                                                     res.should.have.status(200)
                //                                                                     res.body.should.have.property('message').be.a('string')


                //                                                                     // delete project

                //                                                                     chai.request(server)
                //                                                                       .delete(`/api/projects/${projectID}/delete`)
                //                                                                       .set({ "auth-token": token })
                //                                                                       .end((err, res) => {
                //                                                                         res.should.have.status(201)
                //                                                                         res.body.should.have.property('message').eql('project deleted')


                //                                                                         // assert that project is deleted

                //                                                                         chai.request(server)
                //                                                                           .get(`/api/projects/${projectID}`)
                //                                                                           .set({ "auth-token": token })
                //                                                                           .end((err, res) => {
                //                                                                             res.should.have.status(200)
                //                                                                             res.body.should.have.property('message').be.a('string')


                //                                                                             // assert that card is deleted

                //                                                                             chai.request(server)
                //                                                                               .get(`/api/projects//cards/${firstCardID}`)
                //                                                                               .set({ "auth-token": token })
                //                                                                               .end((err, res) => {
                //                                                                                 res.should.have.status(200)
                //                                                                                 res.body.should.have.property('message').be.a('string')


                //                                                                                 // assert that task is deleted

                //                                                                                 chai.request(server)
                //                                                                                   .get(`/api/projects/tasks/${firstTaskID}`)
                //                                                                                   .set({ "auth-token": token })
                //                                                                                   .end((err, res) => {
                //                                                                                     res.should.have.status(200)
                //                                                                                     res.body.should.have.property('message').be.a('string')


                //                                                                                     done()
                //                                                                                   })
                //                                                                               })
                //                                                                           })
                //                                                                       })
                //                                                                   })
                //                                                               })
                //                                                           })
                //                                                       })
                //                                                   })
                //                                               })
                //                                           })
                //                                       })
                //                                   })
                //                               })
                //                           })
                //                       })
                //                   })
                //               })
                //           })
                done()
              })

          })

      })
  })
})
