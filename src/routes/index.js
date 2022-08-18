const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require("axios");
const {Dog , Temperament} = require('../db')
const {APIKEY} = process.env;


const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

const getApi = async () => {
    const apiUrl =  await axios(`https://api.thedogapi.com/v1/breeds?api_key=${APIKEY}`)
    
    const apiInfo = await apiUrl.data.map((e) =>{ 
    return{
        id: e.id,
        weightMin:(e.weight.metric? e.weight.metric.split(' -')[0] : Math.round(e.weight.imperial.split(' -')[0]/2.205).toString()), 
        weightMax:  (e.weight.metric? e.weight.metric.split('- ')[1] : Math.round(e.weight.imperial.split('- ')[1]/2.205).toString()),
        heightMin: e.height.metric.split(' -')[0],
        heightMax: e.height.metric.split('- ')[1],
        name: e.name,
        lifeSpan: e.life_span,
        image: e.image.url,
        temperament: e.temperament ? e.temperament : null
    }})
    return apiInfo 
}

const getBd = async () =>{
    return await Dog.findAll({
        include:{
            model:Temperament,
            attributes: ['name'],
            through:{
                attributes: [],
            },
        }
    })
}


const getAllDogs = async () =>{
    const apiInfo = await getApi();
    const bdInfo = await getBd();
    const infoTotal = apiInfo.concat(bdInfo);
    return infoTotal;
} 

router.get('/dogs', async(req,res)=>{
    const {name} = req.query;
    let dogsTotal = await getAllDogs();
    if(name){
        let dogName = await dogsTotal.filter((d) => d.name.toLowerCase().includes(name.toLowerCase()))
         dogName.length? res.status(200).send(dogName) : res.status(404).send('No existe el perro con ese nombre')
    }else{
        res.status(200).send(dogsTotal) 
    }
})

// router.get('/dogs' , (req,res,next)=>{
//     const restoreDog = await Dog.restore({where: {id : }})
// })

router.get('/temperament' , async (req,res)=>{
    const temperamentApi = await axios.get(`https://api.thedogapi.com/v1/breeds?api_key=${APIKEY}`)

    let temperament = temperamentApi.data.map(e => e.temperament).join(", ").split(", ")

    temperament.forEach(el => {
        Temperament.findOrCreate({
            where : {name: el}
        })
    }) 
    eachTemperament= await Temperament.findAll();
    res.status(200).send(eachTemperament)
   
})
 
router.post("/dog", async(req, res) => {
    const {name, weightMax, weightMin, heightMax, heightMin, temperament, image, createdInDb, origin} = req.body

      let createDog = await Dog.create({name, weightMax, weightMin, heightMax, heightMin, image, origin, createdInDb})
      let temperamentDb= await Temperament.findAll({
          where: { name : temperament }
      })
      createDog.addTemperament(temperamentDb)
      res.json(`Tu perro ${req.body.name} fue creado con éxito.`)
      })



router.get('/dogs/:id', async (req,res) =>{
    const {id} = req.params
    const dogsTotal = await getAllDogs();
    const dogId = dogsTotal.filter(e => e.id == id)
    if(id){
        console.log('hol' , dogId);
        dogId.length? res.status(200).json(dogId) :res.status(404).send(`no existe el perro con el id ${id}😢`)
    }
})

router.delete("/delete/:id" ,  async (req, res)=>{
    const {id} = req.params
    const delet = await Dog.findByPk(id)
    if(!delet){
        res.status(404).send("no existe el perro")
    }
    await delet.destroy()
    res.status(200).send("se elimino")
})

// router.delete('/delete/:id', async(req, res) => {
//     const { id } = req.params
//     try{
//       const dogDelete = await Dog.findByPk(id)
//     if(!dogDelete){
//       res.status(404).send('No existe el perro que quieres eliminar.')
//     } else {
//       await dogDelete.destroy()
//       return res.status(200).send("Se eliminó tu perro.")
//     }} catch(e){
//       throw new Error(e)
//     }
//   })


module.exports = router;
