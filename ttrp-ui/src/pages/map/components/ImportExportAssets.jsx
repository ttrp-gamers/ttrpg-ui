import { useState } from "react";
import { MapService } from "../../../services/MapService";
export default function ImportExportAssets() {
  const [bgFile, setBgFile] = useState(null);
  const [bgName, setBgName] = useState("");
  const [objFile, setObjFile] = useState(null);
  const [objName, setObjName] = useState("");

  const [loadingBg, setLoadingBg] = useState(false);
  const [loadingObj, setLoadingObj] = useState(false);

  // Upload map
  const handleUploadBg = async() => {
    if(!bgFile){
      alert("Please select a background image file.");
      return;
    }
    const formData = new FormData();
    formData.append("file", bgFile);
    if(bgName){
      formData.append("name", bgName);
    }
    try{
      setLoadingBg(true);
      await MapService.importBackground(formData);
      alert("Background uploaded successfully");
      setBgFile(null);
      setBgName("");
     
    }catch(err){
        console.error("Failed to upload background:", err);
        alert("Error uploading background file.");
      }finally{
        setLoadingBg(false);
      }
  };
  const handleUploadObj = async () => {
    if (!objFile) {
      alert("Please select an object image file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", objFile);
    if (objName) {
      formData.append("name", objName);
    }

    try {
      setLoadingObj(true);
      await MapService.importObject(formData);
      alert("Object uploaded successfully!");
      setObjFile(null);
      setObjName("");
    } catch (err) {
      console.error("Failed to upload object:", err);
      alert("Error uploading object file.");
    } finally {
      setLoadingObj(false);
    }
  };
  return (
    <div>
       <div>
        <label>Upload custom background</label>
        <br/>
        <input type="text"
          placeholder="Background name (optional)"
          value={bgName}
          onChange={(e) => setBgName(e.target.value)}></input>
        <br/>
        <input type="file" accept="image/*" onChange={(e) => setBgFile(e.target.files[0])}></input>
        <button onClick={handleUploadBg} disabled={loadingBg}>{loadingBg ? "Uploading..." : "Upload Background"}</button>
        
       </div>
       <div>
        <label style={{ fontWeight: "bold" }}>Upload custom object</label>
        <br />
        <input
          type="text"
          placeholder="Object name (optional)"
          value={objName}
          onChange={(e) => setObjName(e.target.value)}
        />
        <br />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setObjFile(e.target.files[0])}
        />
        <br />
        <button onClick={handleUploadObj} disabled={loadingObj}>
          {loadingObj ? "Uploading..." : "Upload Object"}
        </button>
      </div>
    </div>
  );
};