/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { data_type_integer, data_type_decimal, data_type_text, data_type_date} from "../constants.js";

export const isInteger = (str) => {
    return /^\d+$/.test(str);
  };

export const isDecimal = (str) => {
    return /^\d+(\.\d+)?$/.test(str);
  };

export const isDate = (str) => {
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if(dateRegex.test(str)){
        let dateArray = str.split("/");
        let newDate = new Date(`${dateArray[2]}/${dateArray[1]}/${dateArray[0]}`);
        return !isNaN(newDate.getTime());
    }else{
        return false;
    }
}

//Applies a different type of format validation to a value according to the 
//data type received as a parameter
export const validateDataType = (data_type_id, value) => {
    let valueValidType = false;
    switch (parseInt(data_type_id)) {
        case data_type_integer:
            valueValidType = isInteger(value);
            break;
        case data_type_decimal:
            valueValidType = isDecimal(value);
            break;
        case data_type_date:
            valueValidType = isDate(value);
            break;
        case data_type_text:
            valueValidType = true;
            break;
        default:
            console.log("Invalid data type");
            valueValidType = false;
        }
    return valueValidType;
};

//Validates that the value is within the pre-defined values for a property
export const validatePreDefinedValue = (pre_defined_values, value) => {

    let valueValid = false;
    if(pre_defined_values && pre_defined_values.length > 0){
        if(pre_defined_values.split('/').includes(value)){
            valueValid = true;
        }else{
            valueValid = false;
        }
    }else{
        valueValid = true;
    }

    return valueValid;
};