import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Predefined settings with default values
settingSchema.statics.defaultSettings = {
  allowRegistration: true,
  maxNoteLength: 100000,
  maxFileSizeMB: 5,
  allowPublicNotes: true,
  autoSaveIntervalSeconds: 30,
};

// Initialize default settings if they don't exist
settingSchema.statics.initializeDefaultSettings = async function() {
  const settings = this;
  const defaults = settingSchema.statics.defaultSettings;
  
  for (const [key, value] of Object.entries(defaults)) {
    const exists = await settings.findOne({ key });
    if (!exists) {
      await settings.create({
        key,
        value,
        description: `Default setting for ${key}`,
      });
    }
  }
};

const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
export default Setting;