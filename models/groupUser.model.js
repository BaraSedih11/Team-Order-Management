module.exports = (sequelize, DataTypes) => {
  const GroupUser = sequelize.define("GroupUser", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true // Assuming id is auto-incrementing, though schema has it as part of composite PK.
                       // For simplicity with Sequelize, often a single PK is easier.
                       // If strict adherence to composite PK (id, GROUP_id, USER_id) is needed, this needs adjustment.
    },
    GROUP_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Part of composite PK in schema
      allowNull: false,
      references: {
        model: 'GROUPS',
        key: 'id'
      }
    },
    USER_id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Part of composite PK in schema
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      }
    }
  }, {
    tableName: "GROUP_USERS",
    timestamps: false,
    // Sequelize doesn't directly support composite primary keys in the same way as SQL.
    // A common workaround is to have a single primary key (e.g., auto-incrementing 'id')
    // and then define unique constraints for the combination of GROUP_id and USER_id if needed.
    // However, the schema specifies (id, GROUP_id, USER_id) as PK.
    // For this implementation, I'll make 'id' the primary key and ensure GROUP_id and USER_id are present and part of associations.
    // If the strict composite PK (id, GROUP_id, USER_id) is a hard requirement for database operations outside Sequelize,
    // this model might need further adjustments or raw queries for certain operations.
    // Given the schema, I'll define them as primary keys as per the schema, but Sequelize might behave unexpectedly with multiple autoIncrement:false PKs.
    // Let's assume 'id' is the main PK for Sequelize's ORM features and the others are for reference integrity.
    // Re-evaluating: The schema has `PRIMARY KEY (id, GROUP_id, USER_id)`. This means the combination is unique.
    // Sequelize handles composite keys by setting `primaryKey: true` on multiple attributes.
    // Let's stick to the schema as closely as possible.
    // Removing autoIncrement from 'id' as it's part of a composite key and likely not auto-incrementing in that context.
    indexes: [
      {
        unique: true,
        fields: ['id', 'GROUP_id', 'USER_id'] // Explicitly define the composite primary key for indexing
      }
    ]
  });

  // Adjusting the primary key definition based on the schema's composite key.
  // Sequelize will treat these as a composite key.
  GroupUser.removeAttribute('id'); // Remove the default 'id' if it was added by Sequelize by default

  return sequelize.define("GroupUser", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        // autoIncrement: false, // Not auto-incrementing in a composite key usually
    },
    GROUP_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'GROUPS',
            key: 'id'
        }
    },
    USER_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'USERS',
            key: 'id'
        }
    }
}, {
    tableName: "GROUP_USERS",
    timestamps: false
});


};
