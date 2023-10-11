const noLayout = '../views/layouts/nothing.ejs'


const notFound = (req, res) =>  {
    
    return res.status(404).json({message: "Not Found"})
}

module.exports = notFound
