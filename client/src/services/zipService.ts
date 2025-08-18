import { ZipWriter, BlobWriter, BlobReader } from '@zip.js/zip.js';
import { ProcessingFile } from '../types/quickSign';

export class ZipService {
  static async createZipFileStreaming(processedFiles: ProcessingFile[]): Promise<Blob> {
    const zipWriter = new ZipWriter(new BlobWriter('application/zip'));
    let successCount = 0;
    let errorCount = 0;
    const summary: string[] = [];

    for (const item of processedFiles) {
      const baseFileName = item.file.name.replace(/\.[^.]+$/, '');
      
      if (item.status === 'success' && item.signedBlob) {
        // Add signed file
        await zipWriter.add(
          `signed-files/signed-${item.file.name}`,
          new BlobReader(item.signedBlob)
        );
        
        // Add validation report if available
        if (item.validationBlob) {
          await zipWriter.add(
            `validation-reports/validation-report-${baseFileName}.json`,
            new BlobReader(item.validationBlob)
          );
        }
        
        successCount++;
        summary.push(`✅ ${item.file.name} - Signé et validé avec succès`);
        
        // Clear references for GC
        item.signedBlob = undefined;
        item.validationBlob = undefined;
      } else {
        // Include signed file even if validation failed
        if (item.signedBlob) {
          await zipWriter.add(
            `signed-files/signed-${item.file.name}`,
            new BlobReader(item.signedBlob)
          );
        }
        
        errorCount++;
        summary.push(`❌ ${item.file.name} - ${item.error || 'Erreur inconnue'}`);
      }
    }

    const summaryContent = `Rapport de signature rapide
========================
Date: ${new Date().toLocaleString('fr-FR')}
Fichiers traités: ${processedFiles.length}
Succès: ${successCount}
Échecs: ${errorCount}

Détails:
${summary.join('\n')}

Note: Les fichiers signés se trouvent dans le dossier 'signed-files'
Les rapports de validation se trouvent dans le dossier 'validation-reports'
`;

    await zipWriter.add(
      'resume-traitement.txt', 
      new BlobReader(new Blob([summaryContent], { type: 'text/plain' }))
    );
    
    return await zipWriter.close();
  }
}
