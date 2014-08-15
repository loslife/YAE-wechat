exports.getInsertSqlOfObj = getInsertSqlOfObj;
exports.getUpdateSqlOfObjId = getUpdateSqlOfObjId;
exports.getDelSqlByObjId = getDelSqlByObjId;
exports.replaceColumnName = replaceColumnName;
exports.resumeYLSClientColumnName = resumeYLSClientColumnName;
exports.getCompatibleFields = getCompatibleFields;
//只有迁移到mysql中数据才需要对老版本转换
exports.NEEDCONVERTTABLES =  ["tb_member","tb_memberAccessoryAttrMap","tb_memberCardAttrMap"];
//exports.NEEDCONVERTTABLES =  ["tb_member","tb_memberCardAttrMap","tb_memberAccessoryAttrMap","tb_service_cate","tb_appointment","tb_serviceBill","tb_billAttrMap","tb_serviceAttrMap","tb_empBonusRule","tb_printer"];

var  compatibleFieldMap = {
    "tb_member":"id,enterprise_id,name,sex,birthday,image,loginAccount,password,lastLoginDate,totalLoginNum,des as `desc`,create_date,modify_date,phoneMobile,status,currentScore,totalScore,memberNo,job,def_str1,def_str2,def_str3,def_int1,def_int2,def_int3,def_text1,joinDate",
    "tb_memberCardAttrMap":"id,memberCardId,groupName ,key_s as `key` ,value ,create_date ,modify_date ,enterprise_id ,status ,def_str1 ,def_str2 ,def_str3 ,def_int1 ,def_int2 ,def_int3 ,def_rea1 ,def_rea2 ,def_rea3 ,def_text1",
    "tb_memberAccessoryAttrMap":"id,accessoryId,groupName,key_s as `key`,value,create_date,modify_date,enterprise_id,status"
}

function getCompatibleFields(tableName){
    return compatibleFieldMap[tableName];
}

function replaceColumnName(tableName,data){
    if(exports.NEEDCONVERTTABLES.indexOf(tableName) == -1){
      return;
    }
    if(data.desc){
        data.des = data.desc;
    }
    delete data.desc;

    if(data.key){
        data.key_s = data.key;
    }
    delete data.key;
}



function resumeYLSClientColumnName(data){
    if(data.des){
        data.desc = data.des;
    }
    delete data.des;

    if(data.key_s){
        data.key = data.key_s;
    }
    delete data.key_s;
}

//获取一个对象的SQL插入语句、fitterArray过滤对象属性数组
function getInsertSqlOfObj(dbName, tableName, obj, fitterArray) {
    var field = "(", values = "(";
    var insertObj, key;
    insertObj = fitterArray ? fitterObj(obj, fitterArray) : fitterObj(obj);
    if (_.isEmpty(insertObj)) {
        return "";
    }

    for (key in insertObj) {
        if (insertObj.hasOwnProperty(key)) {
            field += key + ",";
            var tmp = null;
            if(insertObj[key] && _.isString(insertObj[key])){
                tmp =   insertObj[key].replace(new RegExp("'", 'g'),"\\'");
            }else{
                tmp = insertObj[key];
            }
            values += tmp == null ? tmp + "," : "'" + tmp+ "',";

        }
    }
    field = field.slice(0, field.length - 1) + ")";
    values = values.slice(0, values.length - 1) + ")";
    if (dbName) {
        return "insert into " + dbName + "." + tableName + field + " values" + values + ";";
    }
    else {
        return "insert into " + tableName + field + " values" + values + ";";
    }
}


//获取一个对象的SQL更新语句、fitterArray过滤对象属性数组
function getUpdateSqlOfObjId(dbName, tableName, obj, fitterArray) {
    var setFieldStr = "";
    var insertObj, key, id;
    insertObj = fitterArray ? fitterObj(obj, fitterArray) : fitterObj(obj);
    if (_.isEmpty(insertObj)) {
        return "";
    }
    for (key in insertObj) {
        if (insertObj.hasOwnProperty(key)) {
            if (key == "id") {
                id = insertObj[key];
                continue;
            }
            setFieldStr += key + "=" + (insertObj[key] === null ? insertObj[key] + "," : "'" + insertObj[key] + "',");
        }
    }
    setFieldStr = setFieldStr.slice(0, setFieldStr.length - 1);
    if (dbName) {
        return "update " + dbName + "." + tableName + " set " + setFieldStr + " where id='" + id + "';";
    }
    else {
        return "update " + tableName + " set " + setFieldStr + " where id='" + id + "';";
    }
}

//根据id获取SQL删除语句
function getDelSqlByObjId(dbName, tableName, id) {
    if (dbName) {
        return "delete from " + dbName + "." + tableName + " where id = '" + id + "';";
    }
    else {
        return "delete from " + tableName + " where id = '" + id + "';";
    }
}

//过滤对象属性
function fitterObj(obj, fitterArray) {
    var key, fitterResult = {};
    if (fitterArray && !_.isArray(fitterArray)) {
        return fitterResult;
    }
    for (key in obj) {
        if (obj.hasOwnProperty(key) && (!fitterArray || fitterArray.indexOf(key.toString()) !== -1)) {
            if (_.isNumber(obj[key]) || _.isString(obj[key])) {
                //默认""转换为NULL进行插入
                if (obj[key] === "") {
                    fitterResult[key] = null;
                    continue;
                }
                fitterResult[key] = obj[key];
            }
        }
    }
    return fitterResult;
}

