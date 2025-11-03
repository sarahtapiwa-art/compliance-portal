import React, { Suspense } from 'react';
import SubmissionsContent from './submission-content';
// import Loading from '../../loading'; // Create a loading component

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmissionsContent />
    </Suspense>
  );
}