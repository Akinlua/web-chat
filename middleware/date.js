const checkDate = (date) => {

    //split it
    const split_date = date.split("|")
    const date_ = split_date[0]
    const realDate = date_.split(" ")
    const real_date = realDate[0] + " " + realDate[1] + " " + realDate[2]
  
    //get today date
    const currentdate = new Date()
    const dateFormatOptions = {year: 'numeric', month: 'short', day: 'numeric'}
    const formatDate = currentdate.toLocaleDateString(undefined, dateFormatOptions)
  
    //get yesterday's date
    const yesterday = new Date(currentdate)
    yesterday.setDate(currentdate.getDate() - 1)
    const dateFormatOptions_ = {year: 'numeric', month: 'short', day: 'numeric'}
    const newyesterdayDate = yesterday.toLocaleDateString(undefined, dateFormatOptions_)
  
    let updatedDate
    if(real_date == formatDate){
      updatedDate = " Today |" + split_date[1]
    } else if (real_date == newyesterdayDate) {
      updatedDate = " Yesterday |" + split_date[1]
    } else {
      updatedDate = date
    }
    
    return updatedDate
  
}

module.exports = checkDate;