const express = require("express")
const app = express()
const handlebars = require("express-handlebars").engine
const bodyParser = require("body-parser")
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app')
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore')
 
const serviceAccount = require('./node-firestore.json')
const { isArgumentsObject } = require("util/types")
 
initializeApp({
    credential: cert(serviceAccount)
})
 
const db = getFirestore()
 
app.engine("handlebars", handlebars({ defaultLayout: "main" }))
app.set("view engine", "handlebars")
 
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
 
app.get("/", function (req, res) {
    res.render("primeira_pagina")
})
 
app.post("/cadastrar", function (req, res) {
    var result = db.collection('agendamentos').add({
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    }).then(function () {
        console.log('Added document');
        res.redirect('/')
    })
})
 
app.get("/consulta", async function (req, res) {
    try {
        const agendamentosRef = db.collection('agendamentos');
        const querySnapshot = await agendamentosRef.select('nome', 'telefone', 'origem', 'data_contato', 'observacao').get();
        const agendamentos = [];
 
        querySnapshot.forEach((doc) => {
            agendamentos.push({ id: doc.id, ...doc.data() });
        });
 
        res.render("consulta", { agendamentos });
    } catch (error) {
        console.error("Error fetching documents: ", error);
        res.status(500).send("Erro ao buscar documentos");
    }
});
 
app.get("/editar/:id", function (req, res) {
    const agendamentoId = req.params.id;
 
    db.collection('agendamentos').doc(agendamentoId).get()
        .then((doc) => {
            if (!doc.exists) {
                res.status(404).send("Agendamento não encontrado");
            } else {
                res.render("editar", { agendamentos: { id: doc.id, data: doc.data() } });
            }
        })
        .catch((error) => {
            console.log("Erro ao recuperar agendamento:", error);
            res.status(500).send("Erro ao recuperar agendamento");
        });
});
 
app.post("/atualizar", function (req, res) {
    const agendamentoId = req.body.id;
 
    const agendamentoAtualizado = {
        nome: req.body.nome,
        telefone: req.body.telefone,
        origem: req.body.origem,
        data_contato: req.body.data_contato,
        observacao: req.body.observacao
    };
 
    db.collection('agendamentos').doc(agendamentoId).update(agendamentoAtualizado)
        .then(() => {
            console.log('Documento atualizado com sucesso');
            res.redirect('/consulta');
        })
        .catch((error) => {
            console.log("Erro ao atualizar documento:", error);
            res.status(500).send("Erro ao atualizar documento");
        });
})
 
 
 
app.get("/excluir/:id", function (req, res) {
    const agendamentoId = req.params.id;
 
    db.collection('agendamentos').doc(agendamentoId).delete()
        .then(() => {
            console.log('Usuário excluído com sucesso');
            res.redirect('/consulta');
        })
        .catch((error) => {
            console.log("Erro ao excluir usuário:", error);
            res.status(500).send("Erro ao excluir usuário");
        });
});
 
 
app.listen(8081, function () {
    console.log("Servidor ativo!")
})