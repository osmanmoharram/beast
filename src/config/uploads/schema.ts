import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UploadsVariables {
    /**
     * Where uploaded files are written, resolved against the process working
     * directory by `uploadsPath()`. Kept out of the source tree so `nest build`
     * never has to copy user data around.
     */
    @IsString()
    @IsNotEmpty()
    UPLOADS_DIR: string;

    /**
     * Bytes. Enforced by multer while the request is still streaming, so an
     * oversized upload is cut off rather than buffered in full and rejected.
     */
    @IsInt()
    @Min(1)
    @Type(() => Number)
    UPLOADS_MAX_FILE_SIZE: number;
}
