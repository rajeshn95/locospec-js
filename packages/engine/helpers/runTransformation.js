const { pickKeysFromObject } = require("./utils");

const runTransformation = async (context, valueFromSource, transformation) => {
  const { locoAction, resourceModels, locoConfig } = context;

  let transformedValue = valueFromSource;

  const operations = [];
  let resourceSpec = null;

  if (transformation.resource) {
    resourceSpec = resourceModels[transformation.resource];
  }

  switch (transformation.operation) {
    case "alias":
      transformedValue = transformedValue[transformation.findByKey];
      break;

    case "find":
      let getWhere = {};
      getWhere[transformation.findByKey] =
        valueFromSource[transformation.findByValue];
      //   console.log("here to find", valueFromSource, transformation);

      operations.push({
        resourceSpec: resourceSpec,
        operation: "select_first",
        where: getWhere,
      });

      transformedValue = await locoConfig.operator(operations);

      transformedValue = pickKeysFromObject(
        transformedValue,
        Array.isArray(transformation.extract)
          ? transformation.extract
          : [transformation.extract]
      );

      break;

    case "in":
      let whereClause = {};
      whereClause["op"] = "in";
      whereClause["column"] = transformation.findByKey;
      whereClause["value"] = valueFromSource[transformation.findByValue];

      operations.push({
        resourceSpec: resourceSpec,
        operation: "select",
        filters: [whereClause],
        selectColumns: [transformation.extract],
      });

      transformedValue = await locoConfig.operator(operations);

      transformedValue = transformedValue.data.map((t) => {
        return t[transformation.extract];
      });

      arrangedTransformedValue = {};
      arrangedTransformedValue[transformation.findByValue] = transformedValue;
      transformedValue = arrangedTransformedValue;

      break;

    default:
      break;
  }

  //   console.log("ope", operations);

  // console.log("result", transformedValue);

  return transformedValue;
};

module.exports = runTransformation;
