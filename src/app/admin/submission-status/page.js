import React, { Suspense } from 'react';
import SubmissionStatus from "./submission-status";
// import Loading from '../../loading'; // Create a loading component

export default function SubmissionsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SubmissionStatus />
        </Suspense>
    );
}