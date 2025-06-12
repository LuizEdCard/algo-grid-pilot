
import React from 'react';
import RLModelStatus from '../RLModelStatus';
import { RLState } from '../../types/trading';

interface RLModelTabProps {
  rlState: RLState;
  onTrainModel: () => void;
}

const RLModelTab: React.FC<RLModelTabProps> = ({
  rlState,
  onTrainModel
}) => {
  return (
    <div className="space-y-6">
      <RLModelStatus 
        rlState={rlState}
        onTrainModel={onTrainModel}
      />
    </div>
  );
};

export default RLModelTab;
